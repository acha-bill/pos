package report

import (
	"net/http"
	"sort"
	"strconv"
	"sync"
	"time"

	"github.com/acha-bill/pos/models"
	itemService "github.com/acha-bill/pos/packages/dblayer/item"

	saleService "github.com/acha-bill/pos/packages/dblayer/sale"

	"github.com/acha-bill/pos/plugins"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

const (
	// PluginName defines the name of the plugin
	PluginName = "report"
)

var (
	plugin   *Report
	once     sync.Once
	validate *validator.Validate
)

type Report struct {
	name     string
	handlers []*plugins.PluginHandler
}

// AddHandler Method definition from interface
func (plugin *Report) AddHandler(method string, path string, handler func(echo.Context) error, authLevel ...plugins.AuthLevel) {
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
func (plugin *Report) Handlers() []*plugins.PluginHandler {
	return plugin.handlers
}

// Name defines the name of the plugin
func (plugin *Report) Name() string {
	return plugin.name
}

// NewPlugin returns the new plugin
func NewPlugin() *Report {
	plugin := &Report{
		name: PluginName,
	}
	return plugin
}

// Plugin returns an instance of the plugin
func Plugin() *Report {
	once.Do(func() {
		plugin = NewPlugin()
		validate = validator.New()
	})
	return plugin
}

func init() {
	auth := Plugin()
	auth.AddHandler(http.MethodGet, "/sales", sales)
	auth.AddHandler(http.MethodGet, "/selling", sellingItems)

}

// times in nano seconds
func getTimeLabels(start int64, end int64, rangeType string) (res []time.Time) {
	if rangeType == "day" {
		sy, sm, sd := time.Unix(0, start).Date()
		startDate := time.Date(sy, sm, sd, 0, 0, 0, 0, time.Local)
		nextDay := startDate
		res = append(res, startDate)
		for {
			nextDay = nextDay.AddDate(0, 0, 1)
			if nextDay.UnixNano() <= end {
				res = append(res, nextDay)
			} else {
				break
			}
		}
		return
	}
	if rangeType == "week" {
		sy, sm, sd := time.Unix(0, start).Date()
		startDate := time.Date(sy, sm, sd, 0, 0, 0, 0, time.Local)
		nextWeek := startDate
		res = append(res, startDate)
		for {
			nextWeek = nextWeek.AddDate(0, 0, 7)
			if nextWeek.UnixNano() <= end {
				res = append(res, nextWeek)
			} else {
				break
			}
		}
		return
	}
	if rangeType == "month" {
		sy, sm, sd := time.Unix(0, start).Date()
		startDate := time.Date(sy, sm, sd, 0, 0, 0, 0, time.Local)
		nextMonth := startDate
		res = append(res, startDate)
		for {
			nextMonth = nextMonth.AddDate(0, 1, 0)
			if nextMonth.UnixNano() <= end {
				res = append(res, nextMonth)
			} else {
				break
			}
		}
		return
	}
	if rangeType == "year" {
		sy, sm, sd := time.Unix(0, start).Date()
		startDate := time.Date(sy, sm, sd, 0, 0, 0, 0, time.Local)
		nextYear := startDate
		res = append(res, startDate)
		for {
			nextYear = nextYear.AddDate(1, 0, 0)
			if nextYear.UnixNano() <= end {
				res = append(res, nextYear)
			} else {
				break
			}
		}
		return
	}
	res = []time.Time{}
	return
}

func isSameDay(t1 time.Time, t2 time.Time) bool {
	return (t1.Year() == t2.Year()) && (t1.Month() == t2.Month()) && (t1.Day() == t2.Day())
}

func getWeek(t time.Time) int {
	return t.Day() / 7
}
func isSameWeek(t1 time.Time, t2 time.Time) bool {
	return (t1.Year() == t2.Year()) && (t1.Month() == t2.Month()) && (getWeek(t1) == getWeek(t2))
}
func isSameMonth(t1 time.Time, t2 time.Time) bool {
	return (t1.Year() == t2.Year()) && (t1.Month() == t2.Month())
}
func isSameYear(t1 time.Time, t2 time.Time) bool {
	return t1.Year() == t2.Year()
}

type sellingItem struct {
	Item       models.Item `json:"item"`
	GrossSales float64     `json:"grossSales"`
}
type sellingResponse struct {
	TopSelling   []sellingItem `json:"topSelling"`
	WorstSelling []sellingItem `json:"worstSelling"`
}

func sellingItems(c echo.Context) error {
	items, _ := itemService.FindAll()
	itemMap := make(map[*models.Item]float64)
	for _, item := range items {
		itemMap[item] = getSalesForItem(item)
	}

	sort.SliceStable(items, func(i, j int) bool {
		return itemMap[items[i]] < itemMap[items[j]]
	})

	limit := 5
	if len(items) < limit {
		limit = len(items)
	}
	bottom := items[0:limit]
	top := items[len(items)-limit:]
	//reverse top
	for i, j := 0, len(top)-1; i < j; i, j = i+1, j-1 {
		top[i], top[j] = top[j], top[i]
	}

	topSelling := []sellingItem{}
	worstSelling := []sellingItem{}

	for _, item := range top {
		topSelling = append(topSelling, sellingItem{
			Item:       *item,
			GrossSales: itemMap[item],
		})
	}
	for _, item := range bottom {
		worstSelling = append(worstSelling, sellingItem{
			Item:       *item,
			GrossSales: itemMap[item],
		})
	}

	return c.JSON(http.StatusOK, sellingResponse{
		TopSelling:   topSelling,
		WorstSelling: worstSelling,
	})
}

func getSalesForItem(item *models.Item) float64 {
	sales, _ := saleService.FindAll()
	grossSale := 0.0
	for _, sale := range sales {
		for _, li := range sale.LineItems {
			if li.Item.ID.Hex() == item.ID.Hex() {
				grossSale += li.Total
			}
		}
	}
	return grossSale
}

func salesReport(c echo.Context) error {
	startStr := c.QueryParam("start")
	endStr := c.QueryParam("end")
	rangeType := c.QueryParam("rangeType")
	if startStr == "" || endStr == "" || rangeType == "" {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "start, end and rangeType are required",
		})
	}
	itemID := c.QueryParam("itemId")
	categoryID := c.QueryParam("categoryID")
	start, err := strconv.ParseInt(startStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	end, err := strconv.ParseInt(endStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	timeLabels := getTimeLabels(start*1000000, end*1000000, rangeType)
	salesData := make(map[time.Time]float64)
	profitData := make(map[time.Time]float64)

	sales, _ := saleService.FindAll()
	totalGrossSales := 0.0
	totalGrossProfit := 0.0

	for _, t := range timeLabels {
		salesData[t] = 0
		profitData[t] = 0
	}

	for _, t := range timeLabels {
		for _, sale := range sales {
			if rangeType == "day" {
				if !isSameDay(sale.CreatedAt, t) {
					continue
				}
			} else if rangeType == "week" {
				if !isSameWeek(sale.CreatedAt, t) {
					continue
				}
			} else if rangeType == "month" {
				if !isSameMonth(sale.CreatedAt, t) {
					continue
				}
			} else {
				if !isSameYear(sale.CreatedAt, t) {
					continue
				}
			}

			isCategory := false
			if categoryID != "" {
				for _, li := range sale.LineItems {
					if li.Item.Category.Hex() == categoryID {
						salesData[t] += li.Total
						totalGrossSales += li.Total
						lineCost := float64(li.Quantity) * li.Item.PurchasePrice
						profitData[t] += li.Total - lineCost
						totalGrossProfit += li.Total - lineCost
						isCategory = true
					}
				}
			}
			isItem := false
			if !isCategory && itemID != "" {
				for _, li := range sale.LineItems {
					if li.Item.ID.Hex() == itemID {
						salesData[t] += li.Total
						totalGrossSales += li.Total
						lineCost := float64(li.Quantity) * li.Item.PurchasePrice
						profitData[t] += li.Total - lineCost
						totalGrossProfit += li.Total - lineCost
						isItem = true
					}
				}
			}
			if !isCategory && !isItem {
				salesData[t] += sale.Total
				totalGrossSales += sale.Total
				saleCost := 0.0
				for _, li := range sale.LineItems {
					saleCost += float64(li.Quantity) * li.Item.PurchasePrice
				}
				profitData[t] += sale.Total - saleCost
				totalGrossProfit += sale.Total - saleCost
			}
		}
	}

	return c.JSON(http.StatusOK, saleResponse{
		GrossSales:  totalGrossSales,
		GrossProfit: totalGrossProfit,
		SalesData:   salesData,
		ProfitData:  profitData,
	})
}
func sales(c echo.Context) error {
	startStr := c.QueryParam("start")
	endStr := c.QueryParam("end")
	rangeType := c.QueryParam("rangeType")
	if startStr == "" || endStr == "" || rangeType == "" {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: "start, end and rangeType are required",
		})
	}
	itemID := c.QueryParam("itemId")
	categoryID := c.QueryParam("categoryID")
	start, err := strconv.ParseInt(startStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	end, err := strconv.ParseInt(endStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, errorResponse{
			Error: err.Error(),
		})
	}
	timeLabels := getTimeLabels(start*1000000, end*1000000, rangeType)
	salesData := make(map[time.Time]float64)
	profitData := make(map[time.Time]float64)

	sales, _ := saleService.FindAll()
	totalGrossSales := 0.0
	totalGrossProfit := 0.0

	for _, t := range timeLabels {
		salesData[t] = 0
		profitData[t] = 0
	}

	for _, t := range timeLabels {
		for _, sale := range sales {
			if rangeType == "day" {
				if !isSameDay(sale.CreatedAt, t) {
					continue
				}
			} else if rangeType == "week" {
				if !isSameWeek(sale.CreatedAt, t) {
					continue
				}
			} else if rangeType == "month" {
				if !isSameMonth(sale.CreatedAt, t) {
					continue
				}
			} else {
				if !isSameYear(sale.CreatedAt, t) {
					continue
				}
			}

			isCategory := false
			if categoryID != "" {
				for _, li := range sale.LineItems {
					if li.Item.Category.Hex() == categoryID {
						salesData[t] += li.Total
						totalGrossSales += li.Total
						lineCost := float64(li.Quantity) * li.Item.PurchasePrice
						profitData[t] += li.Total - lineCost
						totalGrossProfit += li.Total - lineCost
						isCategory = true
					}
				}
			}
			isItem := false
			if !isCategory && itemID != "" {
				for _, li := range sale.LineItems {
					if li.Item.ID.Hex() == itemID {
						salesData[t] += li.Total
						totalGrossSales += li.Total
						lineCost := float64(li.Quantity) * li.Item.PurchasePrice
						profitData[t] += li.Total - lineCost
						totalGrossProfit += li.Total - lineCost
						isItem = true
					}
				}
			}
			if !isCategory && !isItem {
				salesData[t] += sale.Total
				totalGrossSales += sale.Total
				saleCost := 0.0
				for _, li := range sale.LineItems {
					saleCost += float64(li.Quantity) * li.Item.PurchasePrice
				}
				profitData[t] += sale.Total - saleCost
				totalGrossProfit += sale.Total - saleCost
			}
		}
	}

	return c.JSON(http.StatusOK, saleResponse{
		GrossSales:  totalGrossSales,
		GrossProfit: totalGrossProfit,
		SalesData:   salesData,
		ProfitData:  profitData,
	})
}

type errorResponse struct {
	Error string `json:"error"`
}

type saleResponse struct {
	GrossSales  float64               `json:"grossSales"`
	GrossProfit float64               `json:"grossProfit"`
	SalesData   map[time.Time]float64 `json:"saleData"`
	ProfitData  map[time.Time]float64 `json:"profitData"`
}
