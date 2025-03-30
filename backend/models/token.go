package models

import (
	"github.com/google/uuid"
)

type TokenClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
}
