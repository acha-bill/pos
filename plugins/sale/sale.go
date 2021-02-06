package sale

import (
	"io/ioutil"
	"math"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/prometheus/common/log"

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

func formatSale(s *models.Sale) string {
	var name = "OFFICE & COMMUNICATION HOUSE"
	var street = "OCH LIMBE"
	var town = "Adjacent Rainbow Chemist & UBA Bank"
	var phone = "676 91 22 06 / 233 33 36 19 "
	var endNote = "Dear customer, goods bought are not refundable"
	var thanks = "Thanks for trusting us!!!"

	var lineLength = 42
	var maxQtyLength = 3 + 2   //length of Qty
	var maxTotalLength = 5 + 2 //length of Total
	var maxProductLength = lineLength - (maxQtyLength + maxTotalLength)

	var data = ""
	data += "\n"
	for i := 0; i < (lineLength-len(name))/2; i++ {
		data += " "
	}
	data += name
	data += "\n"
	for i := 0; i < (lineLength-len(street))/2; i++ {
		data += " "
	}
	data += street
	data += "\n"

	for i := 0; i < (lineLength-len(town))/2; i++ {
		data += " "
	}
	data += town
	data += "\n"

	for i := 0; i < (lineLength-len(phone))/2; i++ {
		data += " "
	}
	data += phone
	data += "\n\n"
	data += "   Product"
	for i := 0; i < maxProductLength-len("   Product"); i++ {
		data += " "
	}

	data += "Qty"
	for i := 0; i < maxQtyLength-len("Qty"); i++ {
		data += " "
	}
	data += "Total"
	data += "\n\n"

	for _, item := range s.LineItems {
		var main = "   " + item.Item.Name
		if len(main) > maxProductLength {
			main = main[:maxProductLength]
		}
		//for i := 0; i < maxProductLength-len(main); i++ {
		//	data += " "
		//}
		data += main
		for i := 0; i < maxProductLength-len(main); i++ {
			data += " "
		}

		var qty = strconv.FormatUint(uint64(item.Quantity), 10)
		data += " " + qty
		for i := 0; i < maxQtyLength-len(" "+qty); i++ {
			data += " "
		}

		data += "CFA " + strconv.FormatFloat(item.Total, 'f', 2, 64)
		data += "\n"
	}
	for i := 0; i < lineLength; i++ {
		data += "-"
	}
	data += "\n"
	data += "   Total To Pay"
	for i := 0; i < lineLength/2-len("   Total To Pay"); i++ {
		data += " "
	}
	data += "CFA " + strconv.FormatFloat(s.Total, 'f', 2, 64)
	data += "\n"
	data += "   Paid"
	for i := 0; i < lineLength/2-len("   Paid"); i++ {
		data += " "
	}
	data += "CFA " + strconv.FormatFloat(s.Paid, 'f', 2, 64)
	data += "\n"
	data += "   Change"
	for i := 0; i < lineLength/2-len("   Change"); i++ {
		data += " "
	}
	data += "CFA " + strconv.FormatFloat(s.Change, 'f', 2, 64)
	data += "\n"
	for i := 0; i < lineLength; i++ {
		data += "-"
	}
	data += "\n"
	data += "   Date"
	for i := 0; i < lineLength/2-len("   Date"); i++ {
		data += " "
	}
	data += s.CreatedAt.String()[:19]
	data += "\n"
	data += "   ID"
	for i := 0; i < lineLength/2-len("   ID"); i++ {
		data += " "
	}
	data += s.ID.Hex()[0:]
	data += "\n"
	data += "   Cashier"
	for i := 0; i < lineLength/2-len("   Cashier"); i++ {
		data += " "
	}
	data += s.Cashier.Name
	data += "\n"
	data += "   Comment"
	var c = s.Comment
	if len(c) > lineLength {
		c = c[0:lineLength]
	}
	for i := 0; i < lineLength/2-len("   Comment"); i++ {
		data += " "
	}
	data += c
	data += "\n"
	for i := 0; i < lineLength; i++ {
		data += "-"
	}
	data += "\n"
	for i := 0; i < lineLength/2-len(endNote); i++ {
		data += " "
	}
	data += endNote
	data += "\n"
	for i := 0; i < (lineLength-len(thanks))/2; i++ {
		data += " "
	}
	data += thanks
	return data
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

	receipt := formatSale(created)
	dir, _ := os.Getwd()
	receiptDir := dir + "/receipts"
	if _, err := os.Stat(receiptDir); os.IsNotExist(err) {
		_ = os.Mkdir(receiptDir, 0777)
	}
	err = ioutil.WriteFile(receiptDir+"/"+created.ID.Hex()+".txt", []byte(receipt), 0644)
	if err != nil {
		log.Info("Error writing receipting: ", err.Error())
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
