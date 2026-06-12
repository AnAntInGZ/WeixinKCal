package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	cfg, err := LoadConfig()
	if err != nil {
		log.Fatalf("load config failed: %v", err)
	}

	store, err := OpenStore(cfg)
	if err != nil {
		log.Fatalf("open mysql failed: %v", err)
	}
	defer store.Close()

	mux := http.NewServeMux()
	NewAPIServer(store, cfg).Register(mux)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("weixinkcal cloudrun listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
