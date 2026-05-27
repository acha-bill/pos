package auth

import (
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/acha-bill/pos/models"

	"github.com/acha-bill/pos/packages/dblayer/role"

	"github.com/acha-bill/pos/common"
	userService "github.com/acha-bill/pos/packages/dblayer/user"
	"github.com/acha-bill/pos/plugins"
	"github.com/dgrijalva/jwt-go"
	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	// PluginName defines the name of the plugin
	PluginName = "auth"
)

var (
	plugin *Auth
	once   sync.Once
)

// User structure
type Auth struct {
	name     string
	handlers []*plugins.PluginHandler
}

// AddHandler Method definition from interface
func (plugin *Auth) AddHandler(method string, path string, handler func(echo.Context) error, authLevel ...plugins.AuthLevel) {
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
func (plugin *Auth) Handlers() []*plugins.PluginHandler {
	return plugin.handlers
}

// Name defines the name of the plugin
func (plugin *Auth) Name() string {
	return plugin.name
}

// NewPlugin returns the new plugin
func NewPlugin() *Auth {
	plugin := &Auth{
		name: PluginName,
	}
	return plugin
}

// Plugin returns an instance of the plugin
func Plugin() *Auth {
	once.Do(func() {
		plugin = NewPlugin()
	})
	return plugin
}

func init() {
	auth := Plugin()
	auth.AddHandler(http.MethodPost, "/login", login, plugins.AuthLevelNone)
}

// /// handlers
// @Summary Login user
// @Accept  application/json
// @Produce  application/json
// @Success 200 {object} LoginResponse
// @Router /auth/login [post]
// @Tags User
// @Param login body LoginRequest true "login"
func login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}

	filter := bson.D{primitive.E{Key: "username", Value: req.Username}}
	users, err := userService.Find(filter)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	if len(users) == 0 {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "user not found",
		})
	}
	u := users[0]
	if u.IsRetired {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "user is retired",
		})
	}

	var roles []string
	for _, r := range u.Roles {
		_r, err := role.FindById(r.Hex())
		if err != nil {
			return c.JSON(http.StatusBadRequest, errorResponse{
				Error: err.Error(),
			})
		}
		if _r != nil {
			roles = append(roles, _r.Name)
		}
	}

	if !common.CheckPassword(req.Password, u.Password) {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "invalid password",
		})
	}
	if common.IsLegacyMD5Hash(u.Password) {
		hashedPassword, err := common.HashPassword(req.Password)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, errorResponse{
				Error: err.Error(),
			})
		}
		u.Password = hashedPassword
		if err := userService.UpdateByID(u.ID.Hex(), *u); err != nil {
			log.Errorf("error upgrading password hash for user %s: %v", u.ID.Hex(), err)
		}
	}

	claims := &common.JWTCustomClaims{
		Username: u.Username,
		Id:       u.ID.Hex(),
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 72).Unix(),
		},
		Roles: roles,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, errorResponse{
			Error: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, LoginResponse{
		User:  *u,
		Token: t,
	})
}

// LoginRequest represents the Request object for Login
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents the Response object for Login
type LoginResponse struct {
	User  models.User `json:"user"`
	Token string      `json:"token,omitempty"`
}

// errorResponse represents the Error Response object for Register
type errorResponse struct {
	Error string `json:"error,omitempty"`
}
