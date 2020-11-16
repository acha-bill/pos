package printer

import (
	"net/http"
	"sync"
	"time"

	"github.com/acha-bill/pos/models"
	printerService "github.com/acha-bill/pos/packages/dblayer/printer"
	"github.com/acha-bill/pos/plugins"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	// PluginName defines the name of the plugin
	PluginName = "printer"
)

var (
	plugin   *Printer
	once     sync.Once
	validate *validator.Validate
)

// Auth structure
type Printer struct {
	name     string
	handlers []*plugins.PluginHandler
}

// AddHandler Method definition from interface
func (plugin *Printer) AddHandler(method string, path string, handler func(echo.Context) error, authLevel ...plugins.AuthLevel) {
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
func (plugin *Printer) Handlers() []*plugins.PluginHandler {
	return plugin.handlers
}

// Name defines the name of the plugin
func (plugin *Printer) Name() string {
	return plugin.name
}

// NewPlugin returns the new plugin
func NewPlugin() *Printer {
	plugin := &Printer{
		name: PluginName,
	}
	return plugin
}

// Plugin returns an instance of the plugin
func Plugin() *Printer {
	once.Do(func() {
		plugin = NewPlugin()
		validate = validator.New()
	})
	return plugin
}

func init() {
	plug := Plugin()
	plug.AddHandler(http.MethodGet, "/", listPrinters)
	plug.AddHandler(http.MethodPost, "/", createPrinter)
	plug.AddHandler(http.MethodGet, "/:id", getPrinter)
	plug.AddHandler(http.MethodPut, "/:id", updatePrinter)
	plug.AddHandler(http.MethodDelete, "/:id", deletePrinter)
	plug.AddHandler(http.MethodPost, "/:id/refill", addRefill)
	plug.AddHandler(http.MethodPost, "/:id/toner", changeToner)
	plug.AddHandler(http.MethodPut, "/:id/activate", undDeletePrinter)
}

func changeToner(c echo.Context) error {
	var req tonerRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	id := c.Param("id")

	item, err := printerService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "printer not found",
		})
	}

	item.Toners = append(item.Toners, models.Toner{
		CreatedAt: time.Now(),
		Reference: req.Reference,
	})

	err = printerService.UpdateById(item.ID.Hex(), *item)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	updated, err := printerService.FindById(item.ID.Hex())
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusCreated, updated)

}

func addRefill(c echo.Context) error {
	var req refillRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	id := c.Param("id")

	item, err := printerService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "pritner not found",
		})
	}

	item.Refills = append(item.Refills, models.Refill{
		Color:     req.Color,
		CreatedAt: time.Now(),
		Reference: req.Reference,
		Quality:   req.Quality,
	})

	err = printerService.UpdateById(item.ID.Hex(), *item)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	updated, err := printerService.FindById(item.ID.Hex())
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusCreated, updated)

}
func deletePrinter(c echo.Context) error {
	id := c.Param("id")

	item, err := printerService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "printer not found",
		})
	}
	item.IsRetired = true
	err = printerService.UpdateById(item.ID.Hex(), *item)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.NoContent(http.StatusNoContent)
}

func undDeletePrinter(c echo.Context) error {
	id := c.Param("id")

	item, err := printerService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "printer not found",
		})
	}
	item.IsRetired = false
	err = printerService.UpdateById(item.ID.Hex(), *item)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.NoContent(http.StatusNoContent)
}

func getPrinter(c echo.Context) error {
	id := c.Param("id")
	item, err := printerService.FindById(id)
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

func listPrinters(c echo.Context) error {
	items, err := printerService.FindAll()
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, items)
}

func createPrinter(c echo.Context) error {
	var req createRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	p, err := printerService.FindByName(req.Name)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if p != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "printer already exists",
		})
	}

	created, err := printerService.Create(models.Printer{
		ID:             primitive.NewObjectID(),
		Name:           req.Name,
		MinRetailPrice: req.MinRetailPrice,
		MaxRetailPrice: req.MaxRetailPrice,
		Options:        req.Options,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	})
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusCreated, created)
}

func updatePrinter(c echo.Context) error {
	id := c.Param("id")
	item, err := printerService.FindById(id)
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

	if req.Name != "" {
		item.Name = req.Name
	}
	if req.MinRetailPrice != 0 {
		item.MinRetailPrice = req.MinRetailPrice
	}
	if req.MaxRetailPrice != 0 {
		item.MaxRetailPrice = req.MaxRetailPrice
	}
	if len(req.Options) > 0 {
		item.Options = req.Options
	}
	err = printerService.UpdateById(item.ID.Hex(), *item)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	updated, err := printerService.FindById(item.ID.Hex())
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusCreated, updated)
}

type errorResponse struct {
	Error string `json:"error"`
}
type editRequest struct {
	Name           string   `json:"name"`
	MinRetailPrice float64  `json:"minRetailPrice"`
	MaxRetailPrice float64  `json:"maxRetailPrice"`
	Options        []string `json:"options"`
}
type createRequest struct {
	Name           string   `json:"name"`
	MinRetailPrice float64  `json:"minRetailPrice"`
	MaxRetailPrice float64  `json:"maxRetailPrice"`
	Options        []string `json:"options"`
}
type refillRequest struct {
	Color     string `json:"color"`
	Reference string `json:"reference"`
	Quality   string `json:"quality"`
}
type tonerRequest struct {
	Reference string `json:"reference"`
}
