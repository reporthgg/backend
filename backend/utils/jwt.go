package utils

import (
	"backend/models"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

func GenerateToken(userID uuid.UUID, username string, secret string, expireHours int) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID.String(),
		"username": username,
		"exp":      time.Now().Add(time.Hour * time.Duration(expireHours)).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString string, secret string) (*models.TokenClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, err := uuid.Parse(claims["user_id"].(string))
		if err != nil {
			return nil, err
		}

		return &models.TokenClaims{
			UserID:   userID,
			Username: claims["username"].(string),
		}, nil
	}

	return nil, err
}
