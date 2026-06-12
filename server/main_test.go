package main

import "testing"

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

func TestSafeDatabaseIdentifier(t *testing.T) {
	if !isSafeIdentifier("weixinkcal_2026") {
		t.Fatal("expected identifier to be safe")
	}
	if isSafeIdentifier("weixinkcal-prod") {
		t.Fatal("expected dash to be rejected")
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
