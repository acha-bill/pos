package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Sale defines a sale.
type Sale struct {
	ID        primitive.ObjectID `bson:"_id" json:"_id"`
	LineItems []LineItem         `bson:"lineItems" json:"lineItems"`
	Total     float64            `bson:"total" json:"total"`
	Customer  Customer           `bson:"customer" json:"customer"`
	Paid      float64            `bson:"paid" json:"paid"`
	Change    float64            `bson:"change" json:"change"`
	Comment   string             `bson:"comment" json:"comment"`
	Cashier   User               `bson:"cashier" json:"cashier"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// LineItem defines a line item
type LineItem struct {
	Item        Item        `bson:"item" json:"item"`
	Quantity    uint32      `bson:"qty" json:"qty"`
	RetailPrice float64     `bson:"retailPrice" json:"retailPrice"`
	Discount    uint32      `bson:"discount" json:"discount"`
	Total       float64     `bson:"total" json:"total"`
	IsWholeSale bool        `bson:"isWholeSale" json:"isWholeSale"`
	Printer     Printer     `bson:"printer" json:"printer"`
	PrintDetail PrintDetail `bson:"printDetail" json:"printDetail"`
	Type        string      `bson:'type' json:"type"`
}

type PrintDetail struct {
	Color       string `bson:"color" json:"color"`
	Quality     string `bson:"quality" json:"quality"`
	Description string `bson:"description" json:"description"`
}
