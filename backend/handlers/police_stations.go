package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PoliceStation struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Phone     string  `json:"phone"`
	Address   string  `json:"address"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// Список полицейских участков в бд не успели залить
var policeStations = []PoliceStation{
	{ID: 1, Name: "Департамент полиции г. Нур-Султан", Phone: "+7 (7172) 71-61-71", Address: "пр. Республики, 7", Latitude: 51.1605, Longitude: 71.4704},
	{ID: 2, Name: "Департамент полиции г. Алматы", Phone: "+7 (727) 254-42-22", Address: "ул. Масанчи, 57", Latitude: 43.2551, Longitude: 76.9456},
	{ID: 3, Name: "Департамент полиции г. Шымкент", Phone: "+7 (7252) 53-47-71", Address: "ул. Казыбек би, 36", Latitude: 42.3174, Longitude: 69.5872},
	{ID: 4, Name: "Департамент полиции Акмолинской области", Phone: "+7 (7162) 25-50-02", Address: "г. Кокшетау, ул. Абая, 29", Latitude: 53.2948, Longitude: 69.3944},
	{ID: 5, Name: "Департамент полиции Актюбинской области", Phone: "+7 (7132) 54-45-96", Address: "г. Актобе, пр. Абилкайыр хана, 36", Latitude: 50.2985, Longitude: 57.1487},
}

func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0

	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180

	dLat := lat2Rad - lat1Rad
	dLon := lon2Rad - lon1Rad

	a := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(lat1Rad)*math.Cos(lat2Rad)*math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	distance := R * c

	return distance
}

func (h *Handler) FindNearestPoliceStation(c *gin.Context) {
	latStr := c.Query("latitude")
	lonStr := c.Query("longitude")

	if latStr == "" || lonStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Необходимо указать широту и долготу"})
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат широты"})
		return
	}

	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат долготы"})
		return
	}

	var nearestStation PoliceStation
	minDistance := math.MaxFloat64

	for _, station := range policeStations {
		distance := calculateDistance(lat, lon, station.Latitude, station.Longitude)
		if distance < minDistance {
			minDistance = distance
			nearestStation = station
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"station":     nearestStation,
		"distance_km": minDistance,
	})
}
