package main

import "time"

type AccountPayload struct {
	ID               string `json:"id"`
	CreatedAt        string `json:"createdAt"`
	UpdatedAt        string `json:"updatedAt"`
	ProfileCompleted bool   `json:"profileCompleted"`
	LoginCode        string `json:"loginCode,omitempty"`
	SessionToken     string `json:"sessionToken,omitempty"`
}

type Account struct {
	AccountKey       string `json:"accountKey"`
	OpenID           string `json:"openId,omitempty"`
	SessionToken     string `json:"sessionToken,omitempty"`
	LocalAccountID   string `json:"localAccountId,omitempty"`
	ProfileCompleted bool   `json:"profileCompleted"`
	CreatedAt        string `json:"createdAt"`
	UpdatedAt        string `json:"updatedAt"`
}

type Profile struct {
	Gender        string         `json:"gender"`
	Age           int            `json:"age"`
	HeightCM      int            `json:"heightCm"`
	WeightKG      float64        `json:"weightKg"`
	ActivityLevel string         `json:"activityLevel"`
	Goal          string         `json:"goal"`
	Plan          map[string]any `json:"plan"`
	CreatedAt     string         `json:"createdAt"`
	UpdatedAt     string         `json:"updatedAt"`
}

type FoodItem struct {
	Name        string  `json:"name"`
	Emoji       string  `json:"emoji"`
	AmountGram  float64 `json:"amountGram"`
	KcalPer100G float64 `json:"kcalPer100g"`
	Calories    int     `json:"calories"`
	CarbsG      float64 `json:"carbsG"`
	ProteinG    float64 `json:"proteinG"`
	FatG        float64 `json:"fatG"`
}

type MealRecord struct {
	ID            string     `json:"id"`
	AccountID     string     `json:"accountId,omitempty"`
	DateKey       string     `json:"dateKey"`
	MealType      string     `json:"mealType"`
	Note          string     `json:"note"`
	Items         []FoodItem `json:"items"`
	TotalCalories int        `json:"totalCalories"`
	TotalCarbsG   float64    `json:"totalCarbsG"`
	TotalProteinG float64    `json:"totalProteinG"`
	TotalFatG     float64    `json:"totalFatG"`
	CreatedAt     string     `json:"createdAt"`
	UpdatedAt     string     `json:"updatedAt"`
}

type DailySummary struct {
	TotalCalories     int     `json:"totalCalories"`
	TargetCalories    int     `json:"targetCalories"`
	RemainingCalories int     `json:"remainingCalories"`
	ProgressPercent   int     `json:"progressPercent"`
	TotalCarbsG       float64 `json:"totalCarbsG"`
	TotalProteinG     float64 `json:"totalProteinG"`
	TotalFatG         float64 `json:"totalFatG"`
	Reached           bool    `json:"reached"`
}

type DailyData struct {
	DateKey string       `json:"dateKey"`
	Records []MealRecord `json:"records"`
	Summary DailySummary `json:"summary"`
}

func normalizeMealRecords(records []MealRecord) []MealRecord {
	if records == nil {
		return []MealRecord{}
	}
	return records
}

func nowISO() string {
	return time.Now().UTC().Format(time.RFC3339)
}
