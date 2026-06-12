package main

import (
	"database/sql"
	"encoding/json"
	"math"
	"strings"

	"github.com/go-sql-driver/mysql"
)

type Store struct {
	db *sql.DB
}

func OpenStore(cfg Config) (*Store, error) {
	rootDB, err := sql.Open("mysql", mysqlDSN(cfg, ""))
	if err != nil {
		return nil, err
	}
	defer rootDB.Close()

	if _, err := rootDB.Exec("CREATE DATABASE IF NOT EXISTS `" + cfg.MySQLDatabase + "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"); err != nil {
		return nil, err
	}

	db, err := sql.Open("mysql", mysqlDSN(cfg, cfg.MySQLDatabase))
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(8)
	db.SetMaxIdleConns(4)

	store := &Store{db: db}
	if err := store.Migrate(); err != nil {
		db.Close()
		return nil, err
	}

	return store, nil
}

func mysqlDSN(cfg Config, dbName string) string {
	mysqlCfg := mysql.Config{
		User:      cfg.MySQLUsername,
		Passwd:    cfg.MySQLPassword,
		Net:       "tcp",
		Addr:      cfg.MySQLAddress,
		DBName:    dbName,
		ParseTime: true,
		Params: map[string]string{
			"charset": "utf8mb4,utf8",
		},
	}
	return mysqlCfg.FormatDSN()
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) Ping() error {
	return s.db.Ping()
}

func (s *Store) Migrate() error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS accounts (
			account_key VARCHAR(191) NOT NULL PRIMARY KEY,
			open_id VARCHAR(128) NULL,
			local_account_id VARCHAR(128) NULL,
			profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			UNIQUE KEY uniq_open_id (open_id),
			KEY idx_local_account_id (local_account_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS profiles (
			account_key VARCHAR(191) NOT NULL PRIMARY KEY,
			gender VARCHAR(24) NOT NULL,
			age INT NOT NULL,
			height_cm INT NOT NULL,
			weight_kg DECIMAL(8,2) NOT NULL,
			activity_level VARCHAR(48) NOT NULL,
			goal VARCHAR(48) NOT NULL,
			plan_json JSON NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			CONSTRAINT fk_profiles_account FOREIGN KEY (account_key) REFERENCES accounts(account_key) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS meal_records (
			id VARCHAR(80) NOT NULL PRIMARY KEY,
			account_key VARCHAR(191) NOT NULL,
			local_account_id VARCHAR(128) NULL,
			date_key CHAR(10) NOT NULL,
			meal_type VARCHAR(32) NOT NULL,
			note TEXT NULL,
			items_json JSON NOT NULL,
			total_calories INT NOT NULL DEFAULT 0,
			total_carbs_g DECIMAL(8,2) NOT NULL DEFAULT 0,
			total_protein_g DECIMAL(8,2) NOT NULL DEFAULT 0,
			total_fat_g DECIMAL(8,2) NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			KEY idx_meal_account_date (account_key, date_key, created_at),
			CONSTRAINT fk_meals_account FOREIGN KEY (account_key) REFERENCES accounts(account_key) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
	}

	for _, statement := range statements {
		if _, err := s.db.Exec(statement); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) UpsertAccount(accountKey, openID string, payload AccountPayload) (Account, error) {
	localID := payload.ID

	_, err := s.db.Exec(
		`INSERT INTO accounts (account_key, open_id, local_account_id, profile_completed, created_at, updated_at)
		 VALUES (?, NULLIF(?, ''), NULLIF(?, ''), ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
		 ON DUPLICATE KEY UPDATE
		   local_account_id = COALESCE(NULLIF(VALUES(local_account_id), ''), local_account_id),
		   profile_completed = profile_completed OR VALUES(profile_completed),
		   updated_at = UTC_TIMESTAMP()`,
		accountKey,
		openID,
		localID,
		payload.ProfileCompleted,
	)
	if err != nil {
		return Account{}, err
	}

	return s.GetAccount(accountKey)
}

func (s *Store) GetAccount(accountKey string) (Account, error) {
	var account Account
	var openID, localID sql.NullString
	var createdAt, updatedAt string

	err := s.db.QueryRow(
		`SELECT account_key, open_id, local_account_id, profile_completed,
		        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'),
		        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ')
		   FROM accounts WHERE account_key = ?`,
		accountKey,
	).Scan(&account.AccountKey, &openID, &localID, &account.ProfileCompleted, &createdAt, &updatedAt)
	if err != nil {
		return Account{}, err
	}

	account.OpenID = openID.String
	account.LocalAccountID = localID.String
	account.CreatedAt = createdAt
	account.UpdatedAt = updatedAt
	return account, nil
}

func (s *Store) SaveProfile(accountKey string, profile Profile) (Profile, Account, error) {
	planJSON, err := json.Marshal(profile.Plan)
	if err != nil {
		return Profile{}, Account{}, err
	}

	_, err = s.db.Exec(
		`INSERT INTO profiles (account_key, gender, age, height_cm, weight_kg, activity_level, goal, plan_json, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
		 ON DUPLICATE KEY UPDATE
		   gender = VALUES(gender),
		   age = VALUES(age),
		   height_cm = VALUES(height_cm),
		   weight_kg = VALUES(weight_kg),
		   activity_level = VALUES(activity_level),
		   goal = VALUES(goal),
		   plan_json = VALUES(plan_json),
		   updated_at = UTC_TIMESTAMP()`,
		accountKey,
		profile.Gender,
		profile.Age,
		profile.HeightCM,
		profile.WeightKG,
		profile.ActivityLevel,
		profile.Goal,
		string(planJSON),
	)
	if err != nil {
		return Profile{}, Account{}, err
	}

	if _, err := s.db.Exec(`UPDATE accounts SET profile_completed = TRUE, updated_at = UTC_TIMESTAMP() WHERE account_key = ?`, accountKey); err != nil {
		return Profile{}, Account{}, err
	}

	stored, err := s.GetProfile(accountKey)
	if err != nil {
		return Profile{}, Account{}, err
	}
	account, err := s.GetAccount(accountKey)
	if err != nil {
		return Profile{}, Account{}, err
	}
	return stored, account, nil
}

func (s *Store) GetProfile(accountKey string) (Profile, error) {
	var profile Profile
	var planBytes []byte
	var createdAt, updatedAt string

	err := s.db.QueryRow(
		`SELECT gender, age, height_cm, weight_kg, activity_level, goal, plan_json,
		        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'),
		        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ')
		   FROM profiles WHERE account_key = ?`,
		accountKey,
	).Scan(
		&profile.Gender,
		&profile.Age,
		&profile.HeightCM,
		&profile.WeightKG,
		&profile.ActivityLevel,
		&profile.Goal,
		&planBytes,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return Profile{}, err
	}

	if err := json.Unmarshal(planBytes, &profile.Plan); err != nil {
		return Profile{}, err
	}
	profile.CreatedAt = createdAt
	profile.UpdatedAt = updatedAt
	return profile, nil
}

func (s *Store) SaveMeal(accountKey string, meal MealRecord) (MealRecord, error) {
	itemsJSON, err := json.Marshal(meal.Items)
	if err != nil {
		return MealRecord{}, err
	}

	if meal.ID == "" {
		meal.ID = "meal_" + strings.ReplaceAll(nowISO(), ":", "")
	}
	if meal.CreatedAt == "" {
		meal.CreatedAt = nowISO()
	}
	if meal.UpdatedAt == "" {
		meal.UpdatedAt = nowISO()
	}

	_, err = s.db.Exec(
		`INSERT INTO meal_records
		   (id, account_key, local_account_id, date_key, meal_type, note, items_json,
		    total_calories, total_carbs_g, total_protein_g, total_fat_g, created_at, updated_at)
		 VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
		 ON DUPLICATE KEY UPDATE
		   date_key = VALUES(date_key),
		   meal_type = VALUES(meal_type),
		   note = VALUES(note),
		   items_json = VALUES(items_json),
		   total_calories = VALUES(total_calories),
		   total_carbs_g = VALUES(total_carbs_g),
		   total_protein_g = VALUES(total_protein_g),
		   total_fat_g = VALUES(total_fat_g),
		   updated_at = UTC_TIMESTAMP()`,
		meal.ID,
		accountKey,
		meal.AccountID,
		meal.DateKey,
		meal.MealType,
		meal.Note,
		string(itemsJSON),
		meal.TotalCalories,
		meal.TotalCarbsG,
		meal.TotalProteinG,
		meal.TotalFatG,
	)
	if err != nil {
		return MealRecord{}, err
	}

	return s.GetMeal(accountKey, meal.ID)
}

func (s *Store) GetMeal(accountKey, mealID string) (MealRecord, error) {
	rows, err := s.db.Query(
		`SELECT id, local_account_id, date_key, meal_type, COALESCE(note, ''), items_json,
		        total_calories, total_carbs_g, total_protein_g, total_fat_g,
		        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'),
		        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ')
		   FROM meal_records WHERE account_key = ? AND id = ?`,
		accountKey,
		mealID,
	)
	if err != nil {
		return MealRecord{}, err
	}
	defer rows.Close()

	meals, err := scanMeals(rows)
	if err != nil {
		return MealRecord{}, err
	}
	if len(meals) == 0 {
		return MealRecord{}, sql.ErrNoRows
	}
	return meals[0], nil
}

func (s *Store) ListMeals(accountKey, dateKey string) ([]MealRecord, error) {
	rows, err := s.db.Query(
		`SELECT id, local_account_id, date_key, meal_type, COALESCE(note, ''), items_json,
		        total_calories, total_carbs_g, total_protein_g, total_fat_g,
		        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'),
		        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ')
		   FROM meal_records
		  WHERE account_key = ? AND date_key = ?
		  ORDER BY created_at DESC`,
		accountKey,
		dateKey,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanMeals(rows)
}

func scanMeals(rows *sql.Rows) ([]MealRecord, error) {
	var meals []MealRecord
	for rows.Next() {
		var meal MealRecord
		var localID sql.NullString
		var itemsBytes []byte
		if err := rows.Scan(
			&meal.ID,
			&localID,
			&meal.DateKey,
			&meal.MealType,
			&meal.Note,
			&itemsBytes,
			&meal.TotalCalories,
			&meal.TotalCarbsG,
			&meal.TotalProteinG,
			&meal.TotalFatG,
			&meal.CreatedAt,
			&meal.UpdatedAt,
		); err != nil {
			return nil, err
		}
		meal.AccountID = localID.String
		if err := json.Unmarshal(itemsBytes, &meal.Items); err != nil {
			return nil, err
		}
		meals = append(meals, meal)
	}
	return meals, rows.Err()
}

func SummarizeMeals(records []MealRecord, targetCalories int) DailySummary {
	var summary DailySummary
	summary.TargetCalories = targetCalories
	for _, record := range records {
		summary.TotalCalories += record.TotalCalories
		summary.TotalCarbsG += record.TotalCarbsG
		summary.TotalProteinG += record.TotalProteinG
		summary.TotalFatG += record.TotalFatG
	}
	summary.TotalCarbsG = roundTo(summary.TotalCarbsG, 1)
	summary.TotalProteinG = roundTo(summary.TotalProteinG, 1)
	summary.TotalFatG = roundTo(summary.TotalFatG, 1)
	if targetCalories > 0 {
		summary.RemainingCalories = targetCalories - summary.TotalCalories
		if summary.RemainingCalories < 0 {
			summary.RemainingCalories = 0
		}
		summary.ProgressPercent = int(math.Round(float64(summary.TotalCalories) / float64(targetCalories) * 100))
		if summary.ProgressPercent > 100 {
			summary.ProgressPercent = 100
		}
		summary.Reached = summary.TotalCalories >= targetCalories
	}
	return summary
}

func roundTo(value float64, digits int) float64 {
	factor := math.Pow(10, float64(digits))
	return math.Round(value*factor) / factor
}
