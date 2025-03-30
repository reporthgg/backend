package main

import (
	"backend/config"
	"backend/database"
	"backend/handlers"
	"backend/middleware"
	"backend/routes"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Ошибка загрузки конфигурации: %v", err)
	}

	db, err := database.InitDB(cfg.Database)
	if err != nil {
		log.Fatalf("Ошибка подключения к базе данных: %v", err)
	}
	defer db.Close()

	router := gin.Default()

	h := handlers.NewHandler(db)

	middleware.SetupMiddleware(router)

	routes.SetupRoutes(router, h)

	go h.StartWebSocketServer()

	log.Printf("Сервер запущен на порту %s", cfg.Server.Port)
	if err := router.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
