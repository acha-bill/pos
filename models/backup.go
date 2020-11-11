package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Backup defines a backup.
type Backup struct {
	ID        primitive.ObjectID `bson:"_id" json:"_id"`
	Path      string             `bson:"path" json:"path"`
	Status    bool               `bson:"status"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}
