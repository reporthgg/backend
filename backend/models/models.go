package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Email        string    `json:"email"`
	Role         string    `json:"role"`
	TwoFASecret  string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type News struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	ImageURL  string    `json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
}

type Incident struct {
	ID         uuid.UUID         `json:"id"`
	SenderName string            `json:"sender_name"`
	Subject    string            `json:"subject"`
	Excerpt    string            `json:"excerpt"`
	CreatedAt  time.Time         `json:"created_at"`
	Unread     bool              `json:"unread"`
	Tags       []string          `json:"tags"`
	MediaURLs  []string          `json:"media_urls"`
	Latitude   *float64          `json:"latitude,omitempty"`
	Longitude  *float64          `json:"longitude,omitempty"`
	Messages   []IncidentMessage `json:"messages,omitempty"`
}

type IncidentMessage struct {
	ID         uuid.UUID  `json:"id"`
	IncidentID uuid.UUID  `json:"incident_id"`
	SenderID   *uuid.UUID `json:"sender_id"`
	Message    string     `json:"message"`
	CreatedAt  time.Time  `json:"created_at"`
}

type ChatMessage struct {
	ID          uuid.UUID  `json:"id"`
	SenderID    *uuid.UUID `json:"sender_id"`
	RecipientID *uuid.UUID `json:"recipient_id"`
	Message     string     `json:"message"`
	CreatedAt   time.Time  `json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	TOTPCode string `json:"totp_code"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Role     string `json:"role" binding:"required"`
}

type TokenResponse struct {
	Token string `json:"token"`
}
