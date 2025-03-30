package handlers

import (
	"backend/models"
	"backend/utils"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *Handler) CreateNews(c *gin.Context) {
	title := c.PostForm("title")
	content := c.PostForm("content")

	if title == "" || content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Заголовок и содержание обязательны"})
		return
	}

	var imageURL string
	file, err := c.FormFile("image")
	if err == nil {
		ext := filepath.Ext(file.Filename)
		filename := uuid.New().String() + ext
		dst := filepath.Join("uploads/images", filename)

		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
			return
		}

		imageURL = "/uploads/images/" + filename
	}

	encryptedContent, err := utils.Encrypt([]byte(content), []byte(h.Config.Crypto.Key))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка шифрования содержимого"})
		return
	}

	var newsID uuid.UUID
	err = h.DB.QueryRow(
		"INSERT INTO news (title, content, image_url) VALUES ($1, $2, $3) RETURNING id",
		title, encryptedContent, imageURL,
	).Scan(&newsID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания новости"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":        newsID,
		"title":     title,
		"image_url": imageURL,
		"message":   "Новость успешно создана",
	})
}

func (h *Handler) GetNews(c *gin.Context) {
	rows, err := h.DB.Query("SELECT id, title, content, image_url, created_at FROM news ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения новостей"})
		return
	}
	defer rows.Close()

	var news []models.News
	for rows.Next() {
		var n models.News
		var encryptedContent string
		var createdAt time.Time

		if err := rows.Scan(&n.ID, &n.Title, &encryptedContent, &n.ImageURL, &createdAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка чтения данных новости"})
			return
		}

		contentBytes, err := utils.Decrypt(encryptedContent, []byte(h.Config.Crypto.Key))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка расшифровки содержимого"})
			return
		}

		n.Content = string(contentBytes)
		n.CreatedAt = createdAt
		news = append(news, n)
	}

	c.JSON(http.StatusOK, news)
}
