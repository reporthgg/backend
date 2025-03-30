package handlers

import (
	"backend/config"
	"database/sql"
	"net/http"

	"github.com/gorilla/websocket"
)

type Handler struct {
	DB       *sql.DB
	Config   *config.Config
	Upgrader websocket.Upgrader
	Clients  map[string]*WebSocketClient
}

func NewHandler(db *sql.DB) *Handler {
	cfg, _ := config.LoadConfig()

	return &Handler{
		DB:     db,
		Config: cfg,
		Upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		Clients: make(map[string]*WebSocketClient),
	}
}
