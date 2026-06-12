package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/go-sql-driver/mysql"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return fn(r)
}

func TestAccountKeyPrefersOpenID(t *testing.T) {
	key, err := accountKey("  open123  ", "local123")
	if err != nil {
		t.Fatalf("accountKey returned error: %v", err)
	}
	if key != "openid:open123" {
		t.Fatalf("unexpected key: %s", key)
	}
}

func TestAccountKeyFallsBackToLocalID(t *testing.T) {
	key, err := accountKey("", "local123")
	if err != nil {
		t.Fatalf("accountKey returned error: %v", err)
	}
	if key != "local:local123" {
		t.Fatalf("unexpected key: %s", key)
	}
}

func TestAccountKeyRejectsMissingIdentity(t *testing.T) {
	if _, err := accountKey("", ""); err == nil {
		t.Fatal("expected missing identity error")
	}
}

func TestOpenIDFromLoginCode(t *testing.T) {
	var requestedPath string
	api := NewAPIServer(nil, Config{
		WeChatAppID:     "wx-test",
		WeChatAppSecret: "secret",
		WeChatAPIBase:   "https://wechat.example",
	})
	api.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		requestedPath = r.URL.String()
		return &http.Response{
			StatusCode: http.StatusOK,
			Header:     make(http.Header),
			Body:       io.NopCloser(strings.NewReader(`{"openid":"openid_from_code"}`)),
		}, nil
	})}

	openID, err := api.openIDFromLoginCode("login-code")
	if err != nil {
		t.Fatalf("openIDFromLoginCode returned error: %v", err)
	}
	if openID != "openid_from_code" {
		t.Fatalf("unexpected openid: %s", openID)
	}
	if !strings.Contains(requestedPath, "appid=wx-test") || !strings.Contains(requestedPath, "js_code=login-code") {
		t.Fatalf("unexpected code2session request: %s", requestedPath)
	}
}

func TestSessionTokenRoundTrip(t *testing.T) {
	api := NewAPIServer(nil, Config{WeChatAppSecret: "secret"})
	token, err := api.sessionTokenForOpenID("openid_from_code", time.Now())
	if err != nil {
		t.Fatalf("sessionTokenForOpenID returned error: %v", err)
	}
	openID, err := api.openIDFromSessionToken(token)
	if err != nil {
		t.Fatalf("openIDFromSessionToken returned error: %v", err)
	}
	if openID != "openid_from_code" {
		t.Fatalf("unexpected openid: %s", openID)
	}
}

func TestSessionTokenRejectsTampering(t *testing.T) {
	api := NewAPIServer(nil, Config{WeChatAppSecret: "secret"})
	token, err := api.sessionTokenForOpenID("openid_from_code", time.Now())
	if err != nil {
		t.Fatalf("sessionTokenForOpenID returned error: %v", err)
	}
	if _, err := api.openIDFromSessionToken(token + "x"); err == nil {
		t.Fatal("expected tampered session token to be rejected")
	}
}

func TestSafeDatabaseIdentifier(t *testing.T) {
	if !isSafeIdentifier("weixinkcal_2026") {
		t.Fatal("expected identifier to be safe")
	}
	if isSafeIdentifier("weixinkcal-prod") {
		t.Fatal("expected dash to be rejected")
	}
}

func TestMySQLDSNAllowsNativePasswords(t *testing.T) {
	dsn := mysqlDSN(Config{
		MySQLAddress:  "127.0.0.1:3306",
		MySQLUsername: "root",
		MySQLPassword: "secret",
		MySQLDatabase: "weixinkcal",
	}, "weixinkcal")

	cfg, err := mysql.ParseDSN(dsn)
	if err != nil {
		t.Fatalf("ParseDSN returned error: %v", err)
	}
	if !cfg.AllowNativePasswords {
		t.Fatal("expected mysql_native_password authentication to be allowed")
	}
	if cfg.DBName != "weixinkcal" {
		t.Fatalf("unexpected database name: %s", cfg.DBName)
	}
}

func TestSummarizeMeals(t *testing.T) {
	summary := SummarizeMeals([]MealRecord{
		{TotalCalories: 506, TotalCarbsG: 53, TotalProteinG: 54.5, TotalFatG: 7.6},
		{TotalCalories: 330, TotalCarbsG: 0, TotalProteinG: 62, TotalFatG: 7.2},
	}, 1550)

	if summary.TotalCalories != 836 {
		t.Fatalf("unexpected calories: %d", summary.TotalCalories)
	}
	if summary.RemainingCalories != 714 {
		t.Fatalf("unexpected remaining: %d", summary.RemainingCalories)
	}
	if summary.ProgressPercent != 54 {
		t.Fatalf("unexpected progress: %d", summary.ProgressPercent)
	}
}

func TestDailyDataEmptyRecordsMarshalAsArray(t *testing.T) {
	payload, err := json.Marshal(DailyData{
		DateKey: "2026-06-12",
		Records: normalizeMealRecords(nil),
		Summary: SummarizeMeals(nil, 2000),
	})
	if err != nil {
		t.Fatalf("Marshal returned error: %v", err)
	}
	if !strings.Contains(string(payload), `"records":[]`) {
		t.Fatalf("expected empty records array, got %s", payload)
	}
}
