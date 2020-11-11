package item

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/acha-bill/pos/models"
	categoryService "github.com/acha-bill/pos/packages/dblayer/category"
	itemService "github.com/acha-bill/pos/packages/dblayer/item"
	"github.com/acha-bill/pos/plugins"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	// PluginName defines the name of the plugin
	PluginName = "item"
)

var systemItems = []string{"Photocopy", "Scan", "Spiral"}

var (
	plugin   *Item
	once     sync.Once
	validate *validator.Validate
)

// Auth structure
type Item struct {
	name     string
	handlers []*plugins.PluginHandler
}

// AddHandler Method definition from interface
func (plugin *Item) AddHandler(method string, path string, handler func(echo.Context) error, authLevel ...plugins.AuthLevel) {
	pluginHandler := &plugins.PluginHandler{
		Path:      path,
		Handler:   handler,
		Method:    method,
		AuthLevel: plugins.AuthLevelUser,
	}
	if len(authLevel) > 0 {
		pluginHandler.AuthLevel = authLevel[0]
	}
	plugin.handlers = append(plugin.handlers, pluginHandler)
}

// Handlers Method definition from interface
func (plugin *Item) Handlers() []*plugins.PluginHandler {
	return plugin.handlers
}

// Name defines the name of the plugin
func (plugin *Item) Name() string {
	return plugin.name
}

// NewPlugin returns the new plugin
func NewPlugin() *Item {
	plugin := &Item{
		name: PluginName,
	}
	return plugin
}

// Plugin returns an instance of the plugin
func Plugin() *Item {
	once.Do(func() {
		plugin = NewPlugin()
		validate = validator.New()
	})
	return plugin
}

func Seed() (res []*models.Item, err error) {
	for _, name := range systemItems {
		item, err := itemService.FindByName(name)
		if err != nil {
			log.Panicf("error creating roles: %s", err.Error())
		}
		if item != nil {
			continue
		}
		i := models.Item{
			ID:        primitive.NewObjectID(),
			Name:      name,
			CreatedAt: time.Now(),
			IsSystem:  true,
		}
		_i, err := itemService.Create(i)
		if err != nil {
			log.Panicf("error creating roles: %s", err.Error())
		}
		res = append(res, _i)
	}

	return
}

func init() {
	plug := Plugin()
	plug.AddHandler(http.MethodGet, "/", listItems)
	plug.AddHandler(http.MethodPost, "/", createItem)
	plug.AddHandler(http.MethodPost, "/:id/movestock", moveStock)
	plug.AddHandler(http.MethodGet, "/:id", getItem)
	plug.AddHandler(http.MethodPut, "/:id", updateItem)
	plug.AddHandler(http.MethodDelete, "/:id", deleteItem)

}
func moveStock(c echo.Context) error {
	id := c.Param("id")
	item, err := itemService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "item not found",
		})
	}
	var req moveStockRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	if err := validate.Struct(req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	mvnt := models.StockMovement{
		Type:       req.Type,
		Quantity:   req.Quantity,
		CreatedAt:  time.Now(),
		CurrentQty: item.Quantity,
	}
	item.StockMovements = append(item.StockMovements, mvnt)
	item.Quantity += req.Quantity
	item.UpdatedAt = time.Now()
	_ = itemService.UpdateById(item.ID.Hex(), *item)
	return c.JSON(http.StatusCreated, mvnt)

}

func updateItem(c echo.Context) error {
	id := c.Param("id")
	item, err := itemService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "item not found",
		})
	}
	var req editRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	if err := validate.Struct(req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	if req.Category != "" {
		cat, err := categoryService.FindById(req.Category)
		if err != nil {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: err.Error(),
			})
		}
		if cat == nil && !item.IsSystem {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: fmt.Sprintf("category %s not found", req.Category),
			})
		}
		if cat != nil {
			item.Category = cat.ID
		}
	}
	if req.Barcode != "" {
		item.Barcode = req.Barcode
	}
	if req.Name != "" {
		item.Name = req.Name
	}
	if req.CostPrice != 0 {
		item.CostPrice = req.CostPrice
	}
	if req.PurchasePrice != 0 {
		item.PurchasePrice = req.PurchasePrice
	}
	if req.MinRetailPrice != 0 {
		item.MinRetailPrice = req.MinRetailPrice
	}
	if req.MaxRetailPrice != 0 {
		item.MaxRetailPrice = req.MaxRetailPrice
	}
	if req.MinWholeSalePrice != 0 {
		item.MinWholeSalePrice = req.MinWholeSalePrice
	}
	if req.MaxWholeSalePrice != 0 {
		item.MaxWholeSalePrice = req.MaxWholeSalePrice
	}
	if req.Quantity != 0 {
		item.Quantity = int(req.Quantity)
	}
	if req.MinStock != 0 {
		item.MinStock = req.MinStock
	}
	item.UpdatedAt = time.Now()

	err = itemService.UpdateById(item.ID.Hex(), *item)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	updated, err := itemService.FindById(item.ID.Hex())
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusCreated, updated)
}

func deleteItem(c echo.Context) error {
	id := c.Param("id")

	item, err := itemService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "item not found",
		})
	}
	item.IsRetired = true
	err = itemService.UpdateById(item.ID.Hex(), *item)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.NoContent(http.StatusNoContent)
}

func getItem(c echo.Context) error {
	id := c.Param("id")
	item, err := itemService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "item not found",
		})
	}
	return c.JSON(http.StatusOK, item)
}

func listItems(c echo.Context) error {
	items, err := itemService.FindAll()
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, items)
}

func createItem(c echo.Context) error {
	var req createRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	if err := validate.Struct(req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	for _, name := range systemItems {
		if name == req.Name {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: fmt.Sprintf("%s is a system item and cannot be created/updated", req.Name),
			})
		}
	}

	var categoryID string
	if req.Category == "" {
		cat, err := categoryService.FindByName("General")
		if err != nil {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: err.Error(),
			})
		}
		if cat == nil {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: "General category has not been set",
			})
		}
		categoryID = cat.ID.Hex()
	} else {
		categoryID = req.Category
	}

	cat, err := categoryService.FindById(categoryID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if cat == nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: fmt.Sprintf("Category %s not found", req.Category),
		})
	}

	_item, err := itemService.FindByNameAndCategory(req.Name, cat.ID.Hex())
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: fmt.Sprintf("Category %s not found", req.Category),
		})
	}
	if _item != nil {
		_item.Quantity += int(req.Quantity)
		_item.UpdatedAt = time.Now()
		_ = itemService.UpdateById(_item.ID.Hex(), *_item)
		updated, _ := itemService.FindById(_item.ID.Hex())
		return c.JSON(http.StatusCreated, updated)
	}

	created, err := itemService.Create(models.Item{
		ID:                primitive.NewObjectID(),
		Name:              req.Name,
		Quantity:          int(req.Quantity),
		Barcode:           req.Barcode,
		Category:          cat.ID,
		CostPrice:         req.CostPrice,
		PurchasePrice:     req.PurchasePrice,
		MinRetailPrice:    req.MinRetailPrice,
		MaxRetailPrice:    req.MaxRetailPrice,
		MinWholeSalePrice: req.MinWholeSalePrice,
		MaxWholeSalePrice: req.MaxWholeSalePrice,
		MinStock:          req.MinStock,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		IsRetired:         false,
	})
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusCreated, created)

}

type errorResponse struct {
	Error string `json:"error"`
}

type editRequest struct {
	Name              string  `json:"name"`
	Barcode           string  `json:"barcode"`
	Category          string  `json:"category"`
	CostPrice         float64 `json:"costPrice"`
	PurchasePrice     float64 `json:"purchasePrice"`
	MinRetailPrice    float64 `json:"minRetailPrice"`
	MaxRetailPrice    float64 `json:"maxRetailPrice"`
	MinWholeSalePrice float64 `json:"minWholeSalePrice"`
	MaxWholeSalePrice float64 `json:"maxWholeSalePrice"`
	Quantity          int     `json:"qty"`
	MinStock          int     `json:"minStock"`
}

type createRequest struct {
	Name              string  `json:"name" validate:"required"`
	Barcode           string  `json:"barcode"`
	Category          string  `json:"category"`
	CostPrice         float64 `json:"costPrice"`
	PurchasePrice     float64 `json:"purchasePrice"`
	MinRetailPrice    float64 `json:"minRetailPrice"`
	MaxRetailPrice    float64 `json:"maxRetailPrice"`
	MinWholeSalePrice float64 `json:"minWholeSalePrice"`
	MaxWholeSalePrice float64 `json:"maxWholeSalePrice"`
	Quantity          int     `json:"qty"`
	MinStock          int     `json:"minStock"`
}

type moveStockRequest struct {
	Type     string `json:"type"`
	Quantity int    `json:"qty"`
}
