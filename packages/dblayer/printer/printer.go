package printer

import (
	"context"
	"errors"
	"time"

	"github.com/acha-bill/pos/models"
	"github.com/acha-bill/pos/packages/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	collectionName = "printers"
)

var (
	ctx              = context.TODO()
	ErrNoRowsDeleted = errors.New("no rows were deleted")
)

func collection() *mongo.Collection {
	db, _ := mongodb.Database()
	return db.Collection(collectionName)
}

func FindAll() (rows []*models.Printer, err error) {
	// passing bson.D{{}} matches all documents in the collection
	filter := bson.D{{}}
	rows, err = filterRows(filter)
	return
}

func Find(filter interface{}) (rows []*models.Printer, err error) {
	rows, err = filterRows(filter)
	return
}

func Create(item models.Printer) (created *models.Printer, err error) {
	res, err := collection().InsertOne(ctx, item)
	if err != nil {
		return nil, err
	}
	item.ID = res.InsertedID.(primitive.ObjectID)
	created = &item
	return
}

func FindById(id string) (item *models.Printer, err error) {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return
	}
	filter := bson.D{primitive.E{Key: "_id", Value: objectId}}
	rows, err := filterRows(filter)
	if err != nil {
		return
	}
	if len(rows) == 0 {
		item = nil
	} else {
		item = rows[0]
	}
	return
}

func FindByName(name string) (item *models.Printer, err error) {
	filter := bson.D{primitive.E{Key: "name", Value: name}}
	rows, err := filterRows(filter)
	if err != nil {
		return
	}
	if len(rows) == 0 {
		item = nil
	} else {
		item = rows[0]
	}
	return
}

func UpdateById(id string, item models.Printer) error {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	filter := bson.D{primitive.E{Key: "_id", Value: objectId}}
	value := bson.M{
		"name":           item.Name,
		"minRetailPrice": item.MinRetailPrice,
		"maxRetailPrice": item.MaxRetailPrice,
		"created_at":     item.CreatedAt,
		"updated_at":     time.Now(),
		"options":        item.Options,
		"isRetired":      item.IsRetired,
		"refills":        item.Refills,
		"toners":         item.Toners,
	}
	update := bson.D{primitive.E{Key: "$set", Value: value}}
	return collection().FindOneAndUpdate(ctx, filter, update).Err()
}

func DeleteById(id string) error {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	filter := bson.D{primitive.E{Key: "_id", Value: objectId}}

	res, err := collection().DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if res.DeletedCount == 0 {
		return ErrNoRowsDeleted
	}

	return nil
}

func filterRows(filter interface{}) ([]*models.Printer, error) {
	rows := []*models.Printer{}

	cur, err := collection().Find(ctx, filter)
	if err != nil {
		return rows, err
	}

	for cur.Next(ctx) {
		var u models.Printer
		err := cur.Decode(&u)
		if err != nil {
			return rows, err
		}

		rows = append(rows, &u)
	}

	if err := cur.Err(); err != nil {
		return rows, err
	}

	// once exhausted, close the cursor
	_ = cur.Close(ctx)

	if len(rows) == 0 {
		return rows, nil
	}

	return rows, nil
}
