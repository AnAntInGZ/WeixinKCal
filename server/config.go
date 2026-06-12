package main

import (
	"fmt"
	"os"
	"regexp"
)

type Config struct {
	MySQLAddress  string
	MySQLUsername string
	MySQLPassword string
	MySQLDatabase string
	Port          string
}

func LoadConfig() (Config, error) {
	cfg := Config{
		MySQLAddress:  os.Getenv("MYSQL_ADDRESS"),
		MySQLUsername: os.Getenv("MYSQL_USERNAME"),
		MySQLPassword: os.Getenv("MYSQL_PASSWORD"),
		MySQLDatabase: getenv("MYSQL_DATABASE", getenv("MYSQL_DB", "weixinkcal")),
		Port:          getenv("PORT", "80"),
	}

	if cfg.MySQLAddress == "" {
		return Config{}, fmt.Errorf("MYSQL_ADDRESS is required")
	}
	if cfg.MySQLUsername == "" {
		return Config{}, fmt.Errorf("MYSQL_USERNAME is required")
	}
	if cfg.MySQLPassword == "" {
		return Config{}, fmt.Errorf("MYSQL_PASSWORD is required")
	}
	if !isSafeIdentifier(cfg.MySQLDatabase) {
		return Config{}, fmt.Errorf("MYSQL_DATABASE must contain only letters, numbers, and underscores")
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func isSafeIdentifier(value string) bool {
	return regexp.MustCompile(`^[A-Za-z0-9_]+$`).MatchString(value)
}
