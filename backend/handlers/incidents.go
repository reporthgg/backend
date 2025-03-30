package handlers

import (
	"backend/models"
	"backend/utils"
	"encoding/json"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

func (h *Handler) CreateIncident(c *gin.Context) {
	sender := c.PostForm("sender")
	subject := c.PostForm("subject")
	excerpt := c.PostForm("excerpt")
	tagsJSON := c.PostForm("tags")

	var latitude, longitude *float64

	if latStr := c.PostForm("latitude"); latStr != "" {
		lat, err := strconv.ParseFloat(latStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат широты"})
			return
		}
		latitude = &lat
	}

	if lngStr := c.PostForm("longitude"); lngStr != "" {
		lng, err := strconv.ParseFloat(lngStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат долготы"})
			return
		}
		longitude = &lng
	}

	if sender == "" || subject == "" || excerpt == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Отправитель, тема и описание обязательны"})
		return
	}

	var tags []string
	if tagsJSON != "" {
		if err := json.Unmarshal([]byte(tagsJSON), &tags); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат тегов"})
			return
		}
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка получения формы"})
		return
	}

	files := form.File["media"]
	var mediaURLs []string

	for _, file := range files {
		ext := filepath.Ext(file.Filename)
		filename := uuid.New().String() + ext
		dst := filepath.Join("uploads/media", filename)

		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
			return
		}

		mediaURLs = append(mediaURLs, "/uploads/media/"+filename)
	}

	encryptedExcerpt, err := utils.Encrypt([]byte(excerpt), []byte(h.Config.Crypto.Key))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка шифрования описания"})
		return
	}

	var incidentID uuid.UUID
	err = h.DB.QueryRow(
		"INSERT INTO incidents (sender_name, subject, excerpt, tags, media_urls, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
		sender, subject, encryptedExcerpt, pq.Array(tags), pq.Array(mediaURLs), latitude, longitude,
	).Scan(&incidentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания инцидента"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":         incidentID,
		"sender":     sender,
		"subject":    subject,
		"media_urls": mediaURLs,
		"latitude":   latitude,
		"longitude":  longitude,
		"message":    "Инцидент успешно создан",
	})
}

func (h *Handler) GetIncidents(c *gin.Context) {
	rows, err := h.DB.Query(`
		SELECT id, sender_name, subject, excerpt, created_at, unread, tags, media_urls, latitude, longitude 
		FROM incidents 
		ORDER BY created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения инцидентов"})
		return
	}
	defer rows.Close()

	var incidents []models.Incident
	for rows.Next() {
		var incident models.Incident
		var encryptedExcerpt string
		var createdAt time.Time

		if err := rows.Scan(
			&incident.ID,
			&incident.SenderName,
			&incident.Subject,
			&encryptedExcerpt,
			&createdAt,
			&incident.Unread,
			pq.Array(&incident.Tags),
			pq.Array(&incident.MediaURLs),
			&incident.Latitude,
			&incident.Longitude,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка чтения данных инцидента"})
			return
		}

		excerptBytes, err := utils.Decrypt(encryptedExcerpt, []byte(h.Config.Crypto.Key))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка расшифровки описания"})
			return
		}

		incident.Excerpt = string(excerptBytes)
		incident.CreatedAt = createdAt

		incident.Messages, err = h.getIncidentMessages(incident.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения сообщений инцидента"})
			return
		}

		incidents = append(incidents, incident)
	}

	c.JSON(http.StatusOK, incidents)
}

func (h *Handler) AddIncidentMessage(c *gin.Context) {
	incidentIDStr := c.Param("incident_id")
	incidentID, err := uuid.Parse(incidentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID инцидента"})
		return
	}

	var req struct {
		Message  string     `json:"message" binding:"required"`
		SenderID *uuid.UUID `json:"sender_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	encryptedMessage, err := utils.Encrypt([]byte(req.Message), []byte(h.Config.Crypto.Key))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка шифрования сообщения"})
		return
	}

	var messageID uuid.UUID
	err = h.DB.QueryRow(
		"INSERT INTO incident_messages (incident_id, sender_id, message) VALUES ($1, $2, $3) RETURNING id",
		incidentID, req.SenderID, encryptedMessage,
	).Scan(&messageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения сообщения"})
		return
	}

	_, err = h.DB.Exec("UPDATE incidents SET unread = true WHERE id = $1", incidentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обновления статуса инцидента"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":          messageID,
		"incident_id": incidentID,
		"message":     "Сообщение успешно добавлено",
	})
}

func (h *Handler) getIncidentMessages(incidentID uuid.UUID) ([]models.IncidentMessage, error) {
	rows, err := h.DB.Query(`
		SELECT id, incident_id, sender_id, message, created_at 
		FROM incident_messages 
		WHERE incident_id = $1 
		ORDER BY created_at ASC
	`, incidentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.IncidentMessage
	for rows.Next() {
		var message models.IncidentMessage
		var encryptedMessage string
		var createdAt time.Time

		if err := rows.Scan(
			&message.ID,
			&message.IncidentID,
			&message.SenderID,
			&encryptedMessage,
			&createdAt,
		); err != nil {
			return nil, err
		}

		messageBytes, err := utils.Decrypt(encryptedMessage, []byte(h.Config.Crypto.Key))
		if err != nil {
			return nil, err
		}

		message.Message = string(messageBytes)
		message.CreatedAt = createdAt
		messages = append(messages, message)
	}

	return messages, nil
}

func (h *Handler) MarkIncidentAsRead(c *gin.Context) {
	incidentIDStr := c.Param("incident_id")
	incidentID, err := uuid.Parse(incidentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID инцидента"})
		return
	}

	_, err = h.DB.Exec("UPDATE incidents SET unread = false WHERE id = $1", incidentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обновления статуса инцидента"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Инцидент отмечен как прочитанный"})
}
