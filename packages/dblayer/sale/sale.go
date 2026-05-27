package sale

import (
	"context"
	"time"

	"github.com/acha-bill/pos/models"
	"github.com/acha-bill/pos/packages/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	collectionName = "sales"
)

var (
	ctx = context.TODO()
)

func collection() *mongo.Collection {
	db, _ := mongodb.Database()
	return db.Collection(collectionName)
}

func FindAll() (rows []*models.Sale, err error) {
	// passing bson.D{{}} matches all documents in the collection
	filter := bson.D{{}}
	rows, err = filterRows(filter)
	return
}

func Find(filter interface{}) (rows []*models.Sale, err error) {
	rows, err = filterRows(filter)
	return
}

func FindByCreatedAtRange(start time.Time, end time.Time) (rows []*models.Sale, err error) {
	return Find(bson.M{
		"created_at": bson.M{
			"$gte": start,
			"$lte": end,
		},
	})
}

func Create(item models.Sale) (created *models.Sale, err error) {
	res, err := collection().InsertOne(ctx, item)
	if err != nil {
		return nil, err
	}
	item.ID = res.InsertedID.(primitive.ObjectID)
	created = &item
	return
}

func FindByCustomerID(id string) (res []*models.Sale, err error) {
	objectId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return
	}
	return Find(bson.D{primitive.E{Key: "customer._id", Value: objectId}})
}

func FindById(id string) (item *models.Sale, err error) {
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

func FindByName(name string) (item *models.Sale, err error) {
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

func filterRows(filter interface{}) ([]*models.Sale, error) {
	rows := []*models.Sale{}

	cur, err := collection().Find(ctx, filter)
	if err != nil {
		return rows, err
	}
	defer cur.Close(ctx)

	for cur.Next(ctx) {
		var u models.Sale
		err := cur.Decode(&u)
		if err != nil {
			return rows, err
		}

		rows = append(rows, &u)
	}

	if err := cur.Err(); err != nil {
		return rows, err
	}

	if len(rows) == 0 {
		return rows, nil
	}

	return rows, nil
}
