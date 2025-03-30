package routes

import (
	"backend/handlers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, h *handlers.Handler) {

	router.Static("/uploads", "./uploads")

	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", h.Register)
			auth.POST("/login", h.Login)
		}

		news := api.Group("/news")
		{
			news.GET("", h.GetNews)
		}

		incidents := api.Group("/incidents")
		{
			incidents.POST("", h.CreateIncident)
		}

		secured := api.Group("")
		secured.Use(middleware.AuthMiddleware())
		{
			secured.POST("/news", h.CreateNews)

			secured.GET("/incidents", h.GetIncidents)
			secured.POST("/incidents/:incident_id/messages", h.AddIncidentMessage)
			secured.PUT("/incidents/:incident_id/read", h.MarkIncidentAsRead)

			secured.GET("/chat/messages", h.GetChatMessages)
		}
		api.GET("/police-stations/nearest", h.FindNearestPoliceStation)
	}

	router.GET("/ws/chat", h.WebSocketHandler)
}
