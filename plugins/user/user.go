package user

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/acha-bill/pos/common"
	"github.com/acha-bill/pos/models"
	roleService "github.com/acha-bill/pos/packages/dblayer/role"
	userService "github.com/acha-bill/pos/packages/dblayer/user"
	"github.com/acha-bill/pos/plugins"
	"github.com/acha-bill/pos/plugins/role"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	// PluginName defines the name of the plugin
	PluginName = "user"
)

var (
	plugin   *User
	once     sync.Once
	validate *validator.Validate
)

// User structure
type User struct {
	name     string
	handlers []*plugins.PluginHandler
}

var defaultUsers = []models.User{
	{
		Username: "admin",
		Password: "admin",
	},
}

// AddHandler Method definition from interface
func (plugin *User) AddHandler(method string, path string, handler func(echo.Context) error, authLevel ...plugins.AuthLevel) {
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
func (plugin *User) Handlers() []*plugins.PluginHandler {
	return plugin.handlers
}

// Name defines the name of the plugin
func (plugin *User) Name() string {
	return plugin.name
}

// NewPlugin returns the new plugin
func NewPlugin() *User {
	plugin := &User{
		name: PluginName,
	}
	return plugin
}

// Plugin returns an instance of the plugin
func Plugin() *User {
	once.Do(func() {
		plugin = NewPlugin()
		validate = validator.New()
	})
	return plugin
}

// Seed creates a default user.
func Seed() (res []*models.User, err error) {
	//find admin roles
	r, err := roleService.FindByName(role.AdminRole)
	if err != nil {
		return
	}

	if users, err := userService.FindAll(); err == nil && len(users) == 0 {
		for _, u := range defaultUsers {
			hashedPassword, err := common.HashPassword(u.Password)
			if err != nil {
				return res, err
			}
			_u, _ := userService.Create(models.User{
				ID:        primitive.NewObjectID(),
				Username:  u.Username,
				Name:      u.Username,
				Roles:     []primitive.ObjectID{r.ID},
				Password:  hashedPassword,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			})
			res = append(res, _u)
		}
	}
	return
}

func init() {
	auth := Plugin()
	auth.AddHandler(http.MethodPost, "/", create, plugins.AuthLevelUser)
	auth.AddHandler(http.MethodGet, "/", list, plugins.AuthLevelUser)
	auth.AddHandler(http.MethodGet, "/:id", get, plugins.AuthLevelUser)
	auth.AddHandler(http.MethodDelete, "/:id", deleteUser, plugins.AuthLevelUser)
	auth.AddHandler(http.MethodPut, "/:id", update, plugins.AuthLevelUser)
	auth.AddHandler(http.MethodGet, "/:id/roles", getRoles, plugins.AuthLevelUser)
	auth.AddHandler(http.MethodGet, "/profile/me", getProfile, plugins.AuthLevelUser)

}

func list(c echo.Context) error {
	users, err := userService.FindAll()
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, users)
}

func update(c echo.Context) error {
	id := c.Param("id")

	user, err := userService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if user == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "user not found",
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

	if len(req.Roles) > 0 {
		var roles []primitive.ObjectID
		for _, roleID := range req.Roles {
			_r, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				return c.JSON(http.StatusBadRequest, errorResponse{
					Error: fmt.Errorf("invalid role ID: %s, %w", roleID, err).Error(),
				})
			}

			r, err := roleService.FindById(roleID)
			if err != nil {
				return c.JSON(http.StatusBadRequest, errorResponse{
					Error: err.Error(),
				})
			}
			if r == nil {
				return c.JSON(http.StatusBadRequest, errorResponse{
					Error: fmt.Sprintf("role %s not found: ", roleID),
				})
			}

			roles = append(roles, _r)
		}
		user.Roles = roles
	}

	if req.Name != "" && req.Name != user.Name {
		user.Name = req.Name
	}

	if req.PhoneNumber != "" && req.PhoneNumber != user.PhoneNumber {
		user.PhoneNumber = req.PhoneNumber
	}

	if req.Username != "" && req.Username != user.Username {
		u := userService.FindByUsername(req.Username)
		if u != nil {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: "Username already taken",
			})
		}
		user.Username = req.Username
	}
	if req.Password != "" {
		hashedPassword, err := common.HashPassword(req.Password)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, errorResponse{
				Error: err.Error(),
			})
		}
		user.Password = hashedPassword
	}
	user.UpdatedAt = time.Now()
	err = userService.UpdateByID(user.ID.Hex(), *user)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	updated, err := userService.FindById(user.ID.Hex())
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.JSON(http.StatusCreated, updated)
}

func deleteUser(c echo.Context) error {
	id := c.Param("id")

	user, err := userService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if user == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "user not found",
		})
	}

	user.IsRetired = true
	err = userService.UpdateByID(user.ID.Hex(), *user)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	return c.NoContent(http.StatusNoContent)
}

func getRoles(c echo.Context) error {
	id := c.Param("id")
	user, err := userService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if user == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "user not found",
		})
	}

	var roles []*models.Role
	for _, roleID := range user.Roles {
		r, err := roleService.FindById(roleID.Hex())
		if err != nil {
			return c.JSON(http.StatusNotFound, errorResponse{
				Error: "user not found",
			})
		}
		roles = append(roles, r)
	}
	return c.JSON(http.StatusOK, roles)
}

func get(c echo.Context) error {
	id := c.Param("id")
	user, err := userService.FindById(id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if user == nil {
		return c.JSON(http.StatusNotFound, errorResponse{
			Error: "user not found",
		})
	}
	return c.JSON(http.StatusOK, user)
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

	filter := bson.D{primitive.E{Key: "username", Value: req.Username}}
	users, err := userService.Find(filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, errorResponse{
			Error: err.Error(),
		})
	}
	if len(users) != 0 {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "username already taken",
		})
	}

	hashedPassword, err := common.HashPassword(req.Password)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, errorResponse{
			Error: err.Error(),
		})
	}
	var roles []primitive.ObjectID
	for _, roleID := range req.Roles {
		_r, err := primitive.ObjectIDFromHex(roleID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: fmt.Errorf("invalid role ID: %s, %w", roleID, err).Error(),
			})
		}

		r, err := roleService.FindById(roleID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: err.Error(),
			})
		}
		if r == nil {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: fmt.Sprintf("role %s not found: ", roleID),
			})
		}

		roles = append(roles, _r)
	}

	// assign default role
	if len(roles) == 0 {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "at least 1 role is required",
		})
	}
	u := models.User{
		ID:          primitive.NewObjectID(),
		Username:    req.Username,
		Name:        req.Name,
		Roles:       roles,
		Password:    hashedPassword,
		PhoneNumber: req.PhoneNumber,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	created, err := userService.Create(u)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, created)
}

func getProfile(c echo.Context) error {
	userID := common.GetClaims(c).Id
	user, err := userService.FindById(userID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{Error: err.Error()})
	}
	return c.JSON(http.StatusOK, user)
}

type editRequest struct {
	Username    string   `json:"username"`
	Name        string   `json:"name"`
	PhoneNumber string   `json:"phoneNumber"`
	Roles       []string `json:"roles"`
	Password    string   `json:"password"`
}

// createRequest represents the Request object for Register
type createRequest struct {
	Username    string   `json:"username" validate:"required"`
	Password    string   `json:"password" validate:"required"`
	Roles       []string `json:"roles" validate:"required"`
	Name        string   `json:"name" validate:"required"`
	PhoneNumber string   `json:"phoneNumber" validate:"required"`
}

// errorResponse represents the Error Response object for Register
type errorResponse struct {
	Error string `json:"error,omitempty"`
}
