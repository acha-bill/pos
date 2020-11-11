package sale

import (
	"math"
	"net/http"
	"sync"
	"time"

	printerService "github.com/acha-bill/pos/packages/dblayer/printer"

	customerService "github.com/acha-bill/pos/packages/dblayer/customer"

	itemService "github.com/acha-bill/pos/packages/dblayer/item"

	"github.com/acha-bill/pos/common"
	"github.com/acha-bill/pos/models"
	saleService "github.com/acha-bill/pos/packages/dblayer/sale"
	userService "github.com/acha-bill/pos/packages/dblayer/user"
	"github.com/acha-bill/pos/plugins"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	// PluginName defines the name of the plugin
	PluginName = "sale"
)

var (
	plugin   *Sale
	once     sync.Once
	validate *validator.Validate
)

// Sale structure
type Sale struct {
	name     string
	handlers []*plugins.PluginHandler
}

// AddHandler Method definition from interface
func (plugin *Sale) AddHandler(method string, path string, handler func(echo.Context) error, authLevel ...plugins.AuthLevel) {
	pluginHandler := &plugins.PluginHandler{
		Path:      path,
		Handler:   handler,
		Method:    method,
		AuthLevel: plugins.AuthLevelAdmin,
	}
	if len(authLevel) > 0 {
		pluginHandler.AuthLevel = authLevel[0]
	}
	plugin.handlers = append(plugin.handlers, pluginHandler)
}

// Handlers Method definition from interface
func (plugin *Sale) Handlers() []*plugins.PluginHandler {
	return plugin.handlers
}

// Name defines the name of the plugin
func (plugin *Sale) Name() string {
	return plugin.name
}

// NewPlugin returns the new plugin
func NewPlugin() *Sale {
	plugin := &Sale{
		name: PluginName,
	}
	return plugin
}

// Plugin returns an instance of the plugin
func Plugin() *Sale {
	once.Do(func() {
		plugin = NewPlugin()
		validate = validator.New()
	})
	return plugin
}

func init() {
	sale := Plugin()
	sale.AddHandler(http.MethodGet, "/", list)
	sale.AddHandler(http.MethodPost, "/", create)
	sale.AddHandler(http.MethodGet, "/:id", get)
	sale.AddHandler(http.MethodGet, "/customer/:id", getByCustomer)

}

func getByCustomer(c echo.Context) error {
	id := c.Param("id")
	sales, err := saleService.FindByCustomerID(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, sales)
}

func get(c echo.Context) error {
	id := c.Param("id")
	sale, err := saleService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: err.Error(),
		})
	}
	if sale == nil {
		return c.JSON(http.StatusNotFound, errResponse{
			Error: "sale not found",
		})
	}
	return c.JSON(http.StatusOK, sale)
}

func create(c echo.Context) error {
	var req createRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: err.Error(),
		})
	}

	if err := validate.Struct(req); err != nil {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: err.Error(),
		})
	}

	var customer *models.Customer
	if req.CustomerID != "" {
		cu, err := customerService.FindById(req.CustomerID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, errResponse{
				Error: err.Error(),
			})
		}
		customer = cu
	}

	userID := common.GetClaims(c).Id
	user, err := userService.FindById(userID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: err.Error(),
		})
	}

	if req.Paid-req.Total != req.Change {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: "Change and paid do not sum up",
		})
	}

	var total float64
	var lineItems []models.LineItem
	var updatedItems []*models.Item
	for _, line := range req.LineItems {
		li := models.LineItem{
			Quantity:    line.Quantity,
			RetailPrice: line.RetailPrice,
			Discount:    line.Discount,
			Total:       line.Total,
			Type:        line.Type,
		}

		switch line.Type {
		case "item":
			item, err := itemService.FindById(line.ItemID)
			if err != nil {
				return c.JSON(http.StatusBadRequest, errResponse{
					Error: "item not found",
				})
			}
			li.Item = *item
			li.IsWholeSale = line.IsWholeSale
			item.Quantity = item.Quantity - int(line.Quantity)
			updatedItems = append(updatedItems, item)
		case "print":
			printer, err := printerService.FindById(line.PrinterId)
			if err != nil {
				return c.JSON(http.StatusBadRequest, errResponse{
					Error: "printer not found",
				})
			}
			li.Printer = *printer
			li.PrintDetail = models.PrintDetail{
				Color:       line.PrintDetail.Color,
				Quality:     line.PrintDetail.Quality,
				Description: line.PrintDetail.Description,
			}
		default:
			if err != nil {
				return c.JSON(http.StatusBadRequest, errResponse{
					Error: "invalid line type",
				})
			}
		}

		lineItems = append(lineItems, li)
		total += line.Total
	}

	if total != req.Total {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: "Incorrect total",
		})
	}

	if customer != nil {
		if req.Change < 0 {
			customer.Debt = customer.Debt + math.Abs(req.Change)
			_ = customerService.UpdateById(customer.ID.Hex(), *customer)
		}
	} else {
		customer = &models.Customer{}
	}

	for _, item := range updatedItems {
		_ = itemService.UpdateById(item.ID.Hex(), *item)
	}
	created, err := saleService.Create(models.Sale{
		ID:        primitive.NewObjectID(),
		LineItems: lineItems,
		Total:     req.Total,
		Customer:  *customer,
		Paid:      req.Paid,
		Change:    req.Change,
		Comment:   req.Comment,
		Cashier:   *user,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	})

	if err != nil {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: err.Error(),
		})
	}

	return c.JSON(http.StatusCreated, created)
}
func list(c echo.Context) error {
	sales, err := saleService.FindAll()
	if err != nil {
		return c.JSON(http.StatusBadRequest, errResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, sales)
}

// Response is the response
type errResponse struct {
	Error string `json:"error,omitempty"`
}

type createRequest struct {
	LineItems  []lineItem `json:"lineItems" validate:"required"`
	Total      float64    `json:"total"`
	CustomerID string     `json:"customerId"`
	Paid       float64    `json:"paid"`
	Change     float64    `json:"change"`
	Comment    string     `json:"comment"`
}

type lineItem struct {
	ItemID      string      `json:"itemId"`
	Quantity    uint32      `json:"qty"`
	RetailPrice float64     `json:"retailPrice"`
	Discount    uint32      `json:"discount"`
	Total       float64     `json:"total"`
	IsWholeSale bool        `json:"isWholeSale"`
	PrinterId   string      `json:"printerId"`
	PrintDetail PrintDetail `json:"printDetail"`
	Type        string      `json:"type"`
}

type PrintDetail struct {
	Color       string `json:"color"`
	Quality     string `json:"quality"`
	Description string `json:"description"`
}
