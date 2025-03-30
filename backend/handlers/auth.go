package handlers

import (
	"backend/models"
	"backend/utils"
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func (h *Handler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists bool
	err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1 OR email = $2)",
		req.Username, req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь с таким именем или email уже существует"})
		return
	}

	if req.Role != "citizen" && req.Role != "police" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Роль должна быть 'citizen' или 'police'"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка хеширования пароля"})
		return
	}

	totpSecret, totpURL, err := utils.GenerateTOTPSecret(req.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации TOTP"})
		return
	}

	var userID uuid.UUID
	err = h.DB.QueryRow(
		"INSERT INTO users (username, password_hash, email, role, two_fa_secret) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		req.Username, hashedPassword, req.Email, req.Role, totpSecret,
	).Scan(&userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания пользователя"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Пользователь успешно зарегистрирован",
		"user_id":     userID,
		"totp_url":    totpURL,
		"totp_secret": totpSecret,
	})
}

func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	var passwordHash string
	var totpSecret string
	err := h.DB.QueryRow(
		"SELECT id, username, password_hash, two_fa_secret FROM users WHERE username = $1",
		req.Username,
	).Scan(&user.ID, &user.Username, &passwordHash, &totpSecret)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверное имя пользователя или пароль"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения пользователя"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверное имя пользователя или пароль"})
		return
	}

	if totpSecret != "" {
		if req.TOTPCode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Требуется код двухфакторной аутентификации"})
			return
		}
		if !utils.ValidateTOTP(totpSecret, req.TOTPCode) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный код двухфакторной аутентификации"})
			return
		}
	}

	token, err := utils.GenerateToken(user.ID, user.Username, h.Config.JWT.Secret, h.Config.JWT.ExpireTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации токена"})
		return
	}

	c.JSON(http.StatusOK, models.TokenResponse{Token: token})
}
