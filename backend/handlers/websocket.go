package handlers

import (
	"backend/models"
	"backend/utils"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var (
	clientsMutex sync.Mutex
)

func (h *Handler) WebSocketHandler(c *gin.Context) {
	conn, err := h.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Ошибка обновления до WebSocket: %v", err)
		return
	}
	defer conn.Close()

	userIDStr := c.Query("user_id")
	userRole := c.Query("role")

	var userID *uuid.UUID
	if userIDStr != "" {
		id, err := uuid.Parse(userIDStr)
		if err == nil {
			userID = &id
		}
	}

	clientID := uuid.New().String()
	client := &WebSocketClient{
		Conn:   conn,
		UserID: userID,
		Role:   userRole,
	}

	clientsMutex.Lock()
	h.Clients[clientID] = client
	clientsMutex.Unlock()

	defer func() {
		clientsMutex.Lock()
		delete(h.Clients, clientID)
		clientsMutex.Unlock()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Ошибка чтения: %v", err)
			break
		}

		var chatMessage struct {
			RecipientID *uuid.UUID `json:"recipient_id"`
			Message     string     `json:"message"`
		}
		if err := json.Unmarshal(message, &chatMessage); err != nil {
			log.Printf("Ошибка парсинга сообщения: %v", err)
			continue
		}

		encryptedMessage, err := utils.Encrypt([]byte(chatMessage.Message), []byte(h.Config.Crypto.Key))
		if err != nil {
			log.Printf("Ошибка шифрования сообщения: %v", err)
			continue
		}

		var messageID uuid.UUID
		err = h.DB.QueryRow(
			"INSERT INTO chat_messages (sender_id, recipient_id, message) VALUES ($1, $2, $3) RETURNING id",
			userID, chatMessage.RecipientID, encryptedMessage,
		).Scan(&messageID)
		if err != nil {
			log.Printf("Ошибка сохранения сообщения: %v", err)
			continue
		}

		response := models.ChatMessage{
			ID:          messageID,
			SenderID:    userID,
			RecipientID: chatMessage.RecipientID,
			Message:     chatMessage.Message,
			CreatedAt:   time.Now(),
		}

		responseJSON, err := json.Marshal(response)
		if err != nil {
			log.Printf("Ошибка сериализации ответа: %v", err)
			continue
		}

		clientsMutex.Lock()
		for id, client := range h.Clients {
			if userRole == "citizen" {
				if client.Role == "police" {
					if err := client.Conn.WriteMessage(1, responseJSON); err != nil {
						log.Printf("Ошибка отправки: %v", err)
					}
				}
			} else if userRole == "police" {
				if (chatMessage.RecipientID != nil && client.UserID != nil && *client.UserID == *chatMessage.RecipientID) ||
					(client.Role == "police" && id != clientID) {
					if err := client.Conn.WriteMessage(1, responseJSON); err != nil {
						log.Printf("Ошибка отправки: %v", err)
					}
				}
			}
		}
		clientsMutex.Unlock()
	}
}

func (h *Handler) GetChatMessages(c *gin.Context) {
	userIDStr := c.Query("user_id")
	var userID *uuid.UUID
	if userIDStr != "" {
		id, err := uuid.Parse(userIDStr)
		if err == nil {
			userID = &id
		}
	}

	rows, err := h.DB.Query(`
		SELECT id, sender_id, recipient_id, message, created_at 
		FROM chat_messages 
		WHERE sender_id = $1 OR recipient_id = $1 OR recipient_id IS NULL
		ORDER BY created_at ASC
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения сообщений"})
		return
	}
	defer rows.Close()

	var messages []models.ChatMessage
	for rows.Next() {
		var message models.ChatMessage
		var encryptedMessage string
		var createdAt time.Time

		if err := rows.Scan(
			&message.ID,
			&message.SenderID,
			&message.RecipientID,
			&encryptedMessage,
			&createdAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка чтения данных сообщения"})
			return
		}

		messageBytes, err := utils.Decrypt(encryptedMessage, []byte(h.Config.Crypto.Key))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка расшифровки сообщения"})
			return
		}

		message.Message = string(messageBytes)
		message.CreatedAt = createdAt
		messages = append(messages, message)
	}

	c.JSON(http.StatusOK, messages)
}

func (h *Handler) StartWebSocketServer() {
	log.Println("WebSocket сервер запущен")
}

type WebSocketClient struct {
	Conn   *websocket.Conn
	UserID *uuid.UUID
	Role   string
}
