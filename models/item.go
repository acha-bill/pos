package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Item defines an item
type Item struct {
	ID                primitive.ObjectID `bson:"_id" json:"_id"`
	Name              string             `bson:"name" json:"name"`
	Quantity          int                `bson:"qty" json:"qty"`
	Barcode           string             `bson:"barcode" json:"barcode"`
	Category          primitive.ObjectID `bson:"category" json:"category"`
	CostPrice         float64            `bson:"costPrice" json:"costPrice"`
	PurchasePrice     float64            `bson:"purchasePrice" json:"purchasePrice"`
	MinRetailPrice    float64            `bson:"minRetailPrice" json:"minRetailPrice"`
	MaxRetailPrice    float64            `bson:"maxRetailPrice" json:"maxRetailPrice"`
	MinWholeSalePrice float64            `bson:"minWholeSalePrice" json:"minWholeSalePrice"`
	MaxWholeSalePrice float64            `bson:"maxWholeSalePrice" json:"maxWholeSalePrice"`
	MinStock          int                `bson:"minStock" json:"minStock"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updated_at"`
	IsRetired         bool               `bson:"isRetired" json:"isRetired"`
	IsSystem          bool               `bson:"isSystem" json:"isSystem"`
	StockMovements    []StockMovement    `bson:"stockMovements" json:"stockMovements"`
}
type StockMovement struct {
	Type       string    `bson:"type" json:"type"`
	Quantity   int       `bson:"qty" json:"qty"`
	CurrentQty int       `bson:"currentQty" json:"currentQty"`
	CreatedAt  time.Time `bson:"created_at" json:"created_at"`
}
