package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Printer struct {
	ID             primitive.ObjectID `bson:"_id" json:"_id"`
	Name           string             `bson:"name" json:"name"`
	MinRetailPrice float64            `bson:"minRetailPrice" json:"minRetailPrice"`
	MaxRetailPrice float64            `bson:"maxRetailPrice" json:"maxRetailPrice"`
	Options        []string           `bson:"options" json:"options"`
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt      time.Time          `bson:"updated_at" json:"updated_at"`
	IsRetired      bool               `bson:"isRetired" json:"isRetired"`
	Refills        []Refill           `bson:"refills" json:"refills"`
	Toners         []Toner            `bson:"toners" json:"toners"`
}
type Refill struct {
	Color     string    `bson:"color" json:"color"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	Reference string    `bson:"reference" json:"reference"`
	Quality   string    `bson:"quality" json:"quality"`
}
type Toner struct {
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	Reference string    `bson:"reference" json:"reference"`
}
