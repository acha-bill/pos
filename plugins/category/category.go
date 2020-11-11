package category

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"sync"
	"time"

	itemService "github.com/acha-bill/pos/packages/dblayer/item"

	"github.com/acha-bill/pos/models"
	categoryService "github.com/acha-bill/pos/packages/dblayer/category"
	"github.com/acha-bill/pos/plugins"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	// PluginName defines the name of the plugin
	PluginName      = "category"
	GeneralCategory = "General"
)

var (
	plugin   *Category
	once     sync.Once
	validate *validator.Validate
)

var defaultCategories = []models.Category{
	{
		Name: GeneralCategory,
	},
}

// Auth structure
type Category struct {
	name     string
	handlers []*plugins.PluginHandler
}

// AddHandler Method definition from interface
func (plugin *Category) AddHandler(method string, path string, handler func(echo.Context) error, authLevel ...plugins.AuthLevel) {
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
func (plugin *Category) Handlers() []*plugins.PluginHandler {
	return plugin.handlers
}

// Name defines the name of the plugin
func (plugin *Category) Name() string {
	return plugin.name
}

// NewPlugin returns the new plugin
func NewPlugin() *Category {
	plugin := &Category{
		name: PluginName,
	}
	return plugin
}

// Plugin returns an instance of the plugin
func Plugin() *Category {
	once.Do(func() {
		plugin = NewPlugin()
		validate = validator.New()
	})
	return plugin
}

// Seed creates default system categories
func Seed() (res []*models.Category, err error) {
	if categories, err := categoryService.FindAll(); err == nil && len(categories) == 0 {
		for _, cat := range defaultCategories {
			c := models.Category{
				ID:        primitive.NewObjectID(),
				Name:      cat.Name,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			_c, err := categoryService.Create(c)
			if err != nil {
				log.Panicf("error creating categories: %s", err.Error())
			}
			res = append(res, _c)
		}
	}
	return
}

func init() {
	auth := Plugin()
	auth.AddHandler(http.MethodGet, "/", list)
	auth.AddHandler(http.MethodPost, "/", create)
	auth.AddHandler(http.MethodPut, "/:id", update)
	auth.AddHandler(http.MethodDelete, "/:id", deleteCategory)
	auth.AddHandler(http.MethodGet, "/:id", get)
	auth.AddHandler(http.MethodGet, "/name/:name", getByName)
}

func get(c echo.Context) error {
	id := c.Param("id")
	cat, err := categoryService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if cat == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "category not found",
		})
	}
	return c.JSON(http.StatusOK, cat)

}

func getByName(c echo.Context) error {
	name := c.Param("name")
	decodeName, err := url.QueryUnescape(name)
	if err != nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: err.Error(),
		})
	}
	cat, err := categoryService.FindByName(decodeName)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if cat == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "category not found",
		})
	}
	return c.JSON(http.StatusOK, cat)

}

func deleteCategory(c echo.Context) error {
	id := c.Param("id")
	cat, err := categoryService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if cat == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "category not found",
		})
	}

	if cat.Name == GeneralCategory {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "cannot update/delete General category",
		})
	}

	if cat.IsRetired {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "category is already retired",
		})
	}

	items, err := itemService.FindByCategory(cat.ID.Hex())
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if len(items) != 0 {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "cannot delete category that has items. Delete all items first",
		})
	}
	cat.IsRetired = true
	err = categoryService.UpdateById(cat.ID.Hex(), *cat)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.NoContent(http.StatusNoContent)
}

func update(c echo.Context) error {
	id := c.Param("id")
	cat, err := categoryService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if cat == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "category not found",
		})
	}
	if cat.Name == GeneralCategory {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "cannot update/delete General category",
		})
	}

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

	err = categoryService.UpdateById(id, models.Category{
		Name:      req.Name,
		UpdatedAt: time.Now(),
	})
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	updated, err := categoryService.FindById(cat.ID.Hex())
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusCreated, updated)
}

func list(c echo.Context) error {
	cats, err := categoryService.FindAll()
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, cats)
}

func create(c echo.Context) error {
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

	cat, err := categoryService.FindByName(req.Name)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if cat != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: fmt.Sprintf("category: %s already exists", req.Name),
		})
	}

	created, err := categoryService.Create(models.Category{
		ID:        primitive.NewObjectID(),
		Name:      req.Name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		IsRetired: false,
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

type createRequest struct {
	Name string `json:"name" validate:"required"`
}
