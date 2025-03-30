package database

import (
	"backend/config"
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func InitDB(cfg config.DatabaseConfig) (*sql.DB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		return nil, err
	}

	if err = createTables(db); err != nil {
		return nil, err
	}

	return db, nil
}

func createTables(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			username VARCHAR(50) UNIQUE NOT NULL,
			password_hash VARCHAR(100) NOT NULL,
			email VARCHAR(100) UNIQUE NOT NULL,
			role VARCHAR(20) NOT NULL DEFAULT 'citizen',
			two_fa_secret VARCHAR(50),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS news (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title VARCHAR(200) NOT NULL,
			content TEXT NOT NULL,
			image_url VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS incidents (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			sender_name VARCHAR(100) NOT NULL,
			subject VARCHAR(200) NOT NULL,
			excerpt TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			unread BOOLEAN DEFAULT TRUE,
			tags VARCHAR[] DEFAULT '{}',
			media_urls VARCHAR[] DEFAULT '{}'
		)
	`)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS incident_messages (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
			sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
			message TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS chat_messages (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
			recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
			message TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	return nil
}
