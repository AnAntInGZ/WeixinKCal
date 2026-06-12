package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type APIServer struct {
	store      *Store
	cfg        Config
	httpClient *http.Client
}

type apiResponse struct {
	Code    int    `json:"code"`
	Data    any    `json:"data,omitempty"`
	Message string `json:"message,omitempty"`
}

type accountRequest struct {
	Account AccountPayload `json:"account"`
}

type profileRequest struct {
	Account AccountPayload `json:"account"`
	Profile Profile        `json:"profile"`
}

type mealRequest struct {
	Account AccountPayload `json:"account"`
	Meal    MealRecord     `json:"meal"`
}

type mealListRequest struct {
	Account        AccountPayload `json:"account"`
	DateKey        string         `json:"dateKey"`
	TargetCalories int            `json:"targetCalories"`
}

type weChatCodeSessionResponse struct {
	OpenID  string `json:"openid"`
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

var dateKeyPattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
var sessionTokenTTL = 7 * 24 * time.Hour

func NewAPIServer(store *Store, cfg Config) *APIServer {
	return &APIServer{
		store: store,
		cfg:   cfg,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func (s *APIServer) Register(mux *http.ServeMux) {
	mux.HandleFunc("/", s.index)
	mux.HandleFunc("/healthz", s.healthz)
	mux.HandleFunc("/api/account", s.account)
	mux.HandleFunc("/api/profile", s.profile)
	mux.HandleFunc("/api/profile/get", s.getProfile)
	mux.HandleFunc("/api/meals", s.meals)
	mux.HandleFunc("/api/meals/list", s.listMeals)
}

func (s *APIServer) index(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, apiResponse{Code: 0, Data: map[string]string{"service": "weixinkcal-cloudrun"}})
}

func (s *APIServer) healthz(w http.ResponseWriter, r *http.Request) {
	if err := s.store.Ping(); err != nil {
		writeError(w, http.StatusServiceUnavailable, err)
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Code: 0, Data: map[string]string{"status": "ok"}})
}

func (s *APIServer) account(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, errors.New("method not allowed"))
		return
	}

	var req accountRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	account, err := s.ensureAccount(r, req.Account)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Code: 0, Data: map[string]any{"account": account}})
}

func (s *APIServer) profile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, errors.New("method not allowed"))
		return
	}

	var req profileRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	account, err := s.ensureAccount(r, req.Account)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if err := validateProfile(req.Profile); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	profile, account, err := s.store.SaveProfile(account.AccountKey, req.Profile)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Code: 0, Data: map[string]any{"account": account, "profile": profile}})
}

func (s *APIServer) getProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, errors.New("method not allowed"))
		return
	}

	var req accountRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	account, err := s.ensureAccount(r, req.Account)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	profile, err := s.store.GetProfile(account.AccountKey)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusOK, apiResponse{Code: 0, Data: map[string]any{"account": account, "profile": nil}})
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Code: 0, Data: map[string]any{"account": account, "profile": profile}})
}

func (s *APIServer) meals(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, errors.New("method not allowed"))
		return
	}

	var req mealRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	account, err := s.ensureAccount(r, req.Account)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if err := validateMeal(req.Meal); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	meal, err := s.store.SaveMeal(account.AccountKey, req.Meal)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Code: 0, Data: map[string]any{"account": account, "meal": meal}})
}

func (s *APIServer) listMeals(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, errors.New("method not allowed"))
		return
	}

	var req mealListRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if !dateKeyPattern.MatchString(req.DateKey) {
		writeError(w, http.StatusBadRequest, errors.New("dateKey must use YYYY-MM-DD"))
		return
	}

	account, err := s.ensureAccount(r, req.Account)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	records, err := s.store.ListMeals(account.AccountKey, req.DateKey)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	records = normalizeMealRecords(records)
	data := DailyData{
		DateKey: req.DateKey,
		Records: records,
		Summary: SummarizeMeals(records, req.TargetCalories),
	}
	writeJSON(w, http.StatusOK, apiResponse{Code: 0, Data: map[string]any{"account": account, "daily": data}})
}

func (s *APIServer) ensureAccount(r *http.Request, payload AccountPayload) (Account, error) {
	openID := firstHeader(r, "X-WX-OPENID", "X-WX-FROM-OPENID", "X-WX-USER-OPENID")
	if openID == "" {
		tokenOpenID, err := s.openIDFromSessionToken(payload.SessionToken)
		if err != nil && strings.TrimSpace(payload.LoginCode) == "" {
			return Account{}, err
		}
		openID = tokenOpenID
	}
	if openID == "" {
		resolvedOpenID, err := s.openIDFromLoginCode(payload.LoginCode)
		if err != nil {
			return Account{}, err
		}
		openID = resolvedOpenID
	}
	accountKey, err := accountKey(openID, payload.ID)
	if err != nil {
		return Account{}, err
	}
	account, err := s.store.UpsertAccount(accountKey, openID, payload)
	if err != nil {
		return Account{}, err
	}
	if openID != "" {
		sessionToken, err := s.sessionTokenForOpenID(openID, time.Now())
		if err != nil {
			return Account{}, err
		}
		account.SessionToken = sessionToken
	}
	return account, nil
}

func (s *APIServer) openIDFromLoginCode(loginCode string) (string, error) {
	loginCode = strings.TrimSpace(loginCode)
	if loginCode == "" || strings.TrimSpace(s.cfg.WeChatAppSecret) == "" {
		return "", nil
	}

	endpoint, err := url.Parse(strings.TrimRight(s.cfg.WeChatAPIBase, "/") + "/sns/jscode2session")
	if err != nil {
		return "", err
	}
	query := endpoint.Query()
	query.Set("appid", s.cfg.WeChatAppID)
	query.Set("secret", s.cfg.WeChatAppSecret)
	query.Set("js_code", loginCode)
	query.Set("grant_type", "authorization_code")
	endpoint.RawQuery = query.Encode()

	response, err := s.httpClient.Get(endpoint.String())
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	if response.StatusCode >= http.StatusBadRequest {
		return "", fmt.Errorf("wechat code2session http status %d", response.StatusCode)
	}

	var result weChatCodeSessionResponse
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.ErrCode != 0 {
		return "", fmt.Errorf("wechat code2session failed: %s", result.ErrMsg)
	}
	if strings.TrimSpace(result.OpenID) == "" {
		return "", errors.New("wechat code2session returned empty openid")
	}
	return strings.TrimSpace(result.OpenID), nil
}

func (s *APIServer) sessionTokenForOpenID(openID string, now time.Time) (string, error) {
	openID = strings.TrimSpace(openID)
	secret := strings.TrimSpace(s.cfg.WeChatAppSecret)
	if openID == "" || secret == "" {
		return "", nil
	}

	encodedOpenID := base64.RawURLEncoding.EncodeToString([]byte(openID))
	payload := fmt.Sprintf("%s.%d", encodedOpenID, now.Add(sessionTokenTTL).Unix())
	return payload + "." + s.signSessionPayload(payload), nil
}

func (s *APIServer) openIDFromSessionToken(sessionToken string) (string, error) {
	sessionToken = strings.TrimSpace(sessionToken)
	secret := strings.TrimSpace(s.cfg.WeChatAppSecret)
	if sessionToken == "" || secret == "" {
		return "", nil
	}

	parts := strings.Split(sessionToken, ".")
	if len(parts) != 3 {
		return "", errors.New("invalid session token")
	}
	payload := parts[0] + "." + parts[1]
	expectedSignature := s.signSessionPayload(payload)
	if !hmac.Equal([]byte(parts[2]), []byte(expectedSignature)) {
		return "", errors.New("invalid session token signature")
	}

	expiresAt, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return "", errors.New("invalid session token expiry")
	}
	if time.Now().Unix() > expiresAt {
		return "", errors.New("session token expired")
	}

	openIDBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", errors.New("invalid session token subject")
	}
	openID := strings.TrimSpace(string(openIDBytes))
	if openID == "" {
		return "", errors.New("invalid session token subject")
	}
	return openID, nil
}

func (s *APIServer) signSessionPayload(payload string) string {
	mac := hmac.New(sha256.New, []byte(strings.TrimSpace(s.cfg.WeChatAppSecret)))
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func accountKey(openID, localAccountID string) (string, error) {
	if strings.TrimSpace(openID) != "" {
		return "openid:" + strings.TrimSpace(openID), nil
	}
	if strings.TrimSpace(localAccountID) != "" {
		return "local:" + strings.TrimSpace(localAccountID), nil
	}
	return "", errors.New("missing account identity")
}

func firstHeader(r *http.Request, names ...string) string {
	for _, name := range names {
		if value := strings.TrimSpace(r.Header.Get(name)); value != "" {
			return value
		}
	}
	return ""
}

func readJSON(r *http.Request, target any) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	return decoder.Decode(target)
}

func validateProfile(profile Profile) error {
	if strings.TrimSpace(profile.Gender) == "" {
		return errors.New("gender is required")
	}
	if profile.Age < 12 || profile.Age > 100 {
		return errors.New("age must be between 12 and 100")
	}
	if profile.HeightCM < 100 || profile.HeightCM > 230 {
		return errors.New("heightCm must be between 100 and 230")
	}
	if profile.WeightKG < 30 || profile.WeightKG > 250 {
		return errors.New("weightKg must be between 30 and 250")
	}
	if strings.TrimSpace(profile.ActivityLevel) == "" {
		return errors.New("activityLevel is required")
	}
	if strings.TrimSpace(profile.Goal) == "" {
		return errors.New("goal is required")
	}
	if profile.Plan == nil {
		return errors.New("plan is required")
	}
	return nil
}

func validateMeal(meal MealRecord) error {
	if strings.TrimSpace(meal.DateKey) == "" || !dateKeyPattern.MatchString(meal.DateKey) {
		return errors.New("dateKey must use YYYY-MM-DD")
	}
	if !isAllowedMealType(meal.MealType) {
		return errors.New("mealType is invalid")
	}
	if len(meal.Items) == 0 {
		return errors.New("at least one food item is required")
	}
	for _, item := range meal.Items {
		if strings.TrimSpace(item.Name) == "" {
			return errors.New("food item name is required")
		}
		if item.AmountGram <= 0 || item.AmountGram > 5000 {
			return errors.New("food item amountGram must be between 1 and 5000")
		}
		if item.Calories < 0 {
			return errors.New("food item calories must not be negative")
		}
	}
	if meal.TotalCalories < 0 || meal.TotalCarbsG < 0 || meal.TotalProteinG < 0 || meal.TotalFatG < 0 {
		return errors.New("meal totals must not be negative")
	}
	return nil
}

func isAllowedMealType(value string) bool {
	switch value {
	case "breakfast", "lunch", "dinner", "snack":
		return true
	default:
		return false
	}
}

func writeJSON(w http.ResponseWriter, status int, payload apiResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("write json failed: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, apiResponse{Code: status, Message: err.Error()})
}
