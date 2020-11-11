package main

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"

	"github.com/acha-bill/pos/models"
	backupService "github.com/acha-bill/pos/packages/dblayer/backup"
	"github.com/acha-bill/pos/packages/mongodb"
	"github.com/acha-bill/pos/packages/server"
	"github.com/acha-bill/pos/plugins/category"
	"github.com/acha-bill/pos/plugins/item"
	"github.com/acha-bill/pos/plugins/role"
	"github.com/acha-bill/pos/plugins/user"
	"github.com/labstack/gommon/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func init() {
}

// @title pos API
// @version 1.0
// @description API for pos
// @termsOfService http://swagger.io/terms/

// @contact.name Acha Bill
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1
// @query.collection.format multi

// @securityDefinitions.basic BasicAuth

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
func main() {

	_, err := mongodb.Connect()
	if err != nil {
		log.Fatal(err)
	}

	_, err = role.Seed()
	if err != nil {
		log.Errorf("error seeding default user: %w", err)
	}

	_, err = user.Seed()
	if err != nil {
		log.Errorf("error seeding default user: %w", err)
	}

	_, err = category.Seed()
	if err != nil {
		log.Errorf("error seeding default categories: %w", err)
	}

	_, err = item.Seed()
	if err != nil {
		log.Errorf("error seeding default items: %w", err)
	}

	e := server.Instance()
	e.Static("/", "./public")

	dir, err := os.Getwd()
	if err != nil {
		log.Errorf("error getting work dir: %w", err)
	}
	backupDir := dir + "/backups"
	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		err = os.Mkdir(backupDir, 0777)
		if err != nil {
			log.Errorf("error creating backup dir: %w", err)
		}
	}

	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGQUIT, syscall.SIGTERM)
	go backupWorker(backupDir, c)

	e.Logger.Fatal(e.Start(":8081"))
}

func backupWorker(backupDir string, c chan os.Signal) {
	ticker := time.NewTicker(1 * time.Hour)
	for {
		select {
		case <-ticker.C:
			_, err := exec.Command("mongodump", "--out", backupDir).Output()
			status := true
			if err != nil {
				log.Error(err.Error())
				status = false
			}

			backups, err := backupService.FindAll()
			if err != nil {
				log.Error(err.Error())
			} else {
				if len(backups) == 0 {
					_, _ = backupService.Create(models.Backup{
						ID:        primitive.NewObjectID(),
						Path:      backupDir,
						CreatedAt: time.Now(),
						Status:    status,
					})
				} else {
					backup := backups[len(backups)-1]
					backup.Path = backupDir
					backup.Status = status
					backup.UpdatedAt = time.Now()
					_ = backupService.UpdateById(backup.ID.Hex(), *backup)
				}

			}
		case <-c:
			fmt.Println("shutdown...")
			return
		}
	}
}
