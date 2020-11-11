import React, { useEffect, useState } from 'react';
import './dash.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import CachedIcon from '@material-ui/icons/Cached';
import { BarChart, PieChart, Pie, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';
import { renderCustomizedLabel, COLORS } from '../../components/primaryPieChart/primaryPieChart';
import { DateRangePicker } from '../../components';
import EditIcon from '@material-ui/icons/Edit';
import apis from "../../apis/apis";
import Moment from 'react-moment';


const pieChartData = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
];


const Dashboard = () => {

    const currentDate = new Date()
    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    const [startDate, setStartDate] = useState(startMonth)
    const [endDate, setEndDate] = useState(currentDate)
    const [rangeType, setRangeType] = useState("day")
    const [isDatePickerOPen, setDatePickerOpen] = useState(false)
    const [saleData, setSaleData] = useState([])
    const [grossSales, setGrossSales] = useState(0)
    const [grossProfit, setGrossProfit] = useState(0)
    const [topSellingData, setTopSellingData] = useState([])
    const [worstSellingData, setWorstSellingData] = useState([])
    const [updatedAt, setUpdatedAt] = useState(new Date())


    useEffect(() => {
        getSales()
        getSelling()
    }, [])

    const getSales = async () => {
        const res = await apis.reportApi.sales(startDate.getTime(), endDate.getTime(), "", "", rangeType)
        const { saleData, grossSales, grossProfit } = res

        let tmpSaleData = []
        Object.keys(saleData).forEach(key => {
            tmpSaleData.push({ label: new Date(key).toLocaleDateString(), total: saleData[key] })
        })
        setSaleData(tmpSaleData)
        setGrossSales(grossSales)
        setGrossProfit(grossProfit)
        setUpdatedAt(new Date())

    }

    const getSelling = async () => {
        const res = await apis.reportApi.selling(startDate.getTime(), endDate.getTime())
        let worstSellingData = []
        let topSellingData = []

        res.worstSelling.forEach(s => {
            worstSellingData.push({ name: s.item.name, value: s.grossSales })
        })
        res.topSelling.forEach(s => {
            topSellingData.push({ name: s.item.name, value: s.grossSales })
        })

        //normalze worst selling items
        if (worstSellingData.filter(i => i.value === 0).length === worstSellingData.length) {
            worstSellingData = worstSellingData.map(i => {
                i.value = 100 / worstSellingData.length
                return i
            })
        }

        //normalze top selling items
        if (topSellingData.filter(i => i.value === 0).length === topSellingData.length) {
            topSellingData = topSellingData.map(i => {
                i.value = 100 / topSellingData.length
                return i
            })
        }
        setTopSellingData(topSellingData)
        setWorstSellingData(worstSellingData)
        setUpdatedAt(new Date())
    }


    const handleDatePickerSaved = (dates) => {
        let _startDate = new Date(`${dates.start}T${dates.startTime}`);
        let _endDate = new Date(`${dates.end}T${dates.endTime}`);
        if (dates.type === 'year') {
            _startDate = new Date(dates.start, 0)
            _endDate = new Date(dates.end, 0)
        }
        setStartDate(_startDate)
        setEndDate(_endDate)
        setRangeType(dates.type)
        setDatePickerOpen(false)
    }

    const handleRefresh = () => {
        getSales()
        getSelling()
    }


    return (
        <div>
            <div>
                <div className="overview">
                    <h5>Sale overview</h5>
                    <div className="overview__inputs">
                        <div>
                            Start date {startDate.toLocaleDateString()}&nbsp;
                            End date {endDate.toLocaleDateString()} &nbsp;  <span className="ml-2" onClick={() => setDatePickerOpen(true)}><EditIcon style={{ fontSize: 20 }} /></span>
                            {isDatePickerOPen && <DateRangePicker label="dashboard" default="week" onClose={() => setDatePickerOpen(false)} onSave={handleDatePickerSaved}></DateRangePicker>}
                        </div>
                        <button onClick={handleRefresh} type="button" class="btn btn-secondary">
                            <CachedIcon />
                            Refresh
                        </button>

                    </div>
                </div>
                <div className="row row-cols-4 d-flex justify-content-center align-items-center">
                    <div className="col p-0 card mx-4 text-white bg-primary shadow" style={{ maxWidth: "15rem" }}>
                        <div className="card-header text-center">gross sales</div>
                        <div className="card-body">
                            <h5 className="card-title text-center">{grossSales} XAF</h5>
                            <p className="card-text text-center"><small>Last updated  <Moment fromNow>{updatedAt}</Moment></small></p>
                        </div>
                    </div>
                    <div className="col p-0 card mx-4 text-white bg-success shadow" style={{ maxWidth: "15rem" }}>
                        <div className="card-header text-center">gross profit</div>
                        <div className="card-body">
                            <h5 className="card-title text-center">{grossProfit} XAF</h5>
                            <p className="card-text text-center"><small>Last updated  <Moment fromNow>{updatedAt}</Moment></small></p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="separator"></div>
            <div class="container mt-5">
                <div class="col mt-2">
                    <div>
                        <h4 className="card-title text-center">Sales</h4>
                    </div>
                    <BarChart
                        width={1000}
                        height={300}
                        data={saleData}
                        margin={{
                            top: 5, right: 30, left: 20, bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#8884d8" />
                    </BarChart>
                </div>
                <div class="row row-cols-2 ">
                    <div class="col">
                        <div>
                            <h4 className="card-title text-center">Top selling items</h4>
                        </div>
                        <PieChart width={500} height={300} >
                            <Pie
                                data={topSellingData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            > {
                                    topSellingData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
                                }
                            </Pie>
                        </PieChart>
                    </div>
                    <div class="col">
                        <div>
                            <h4 className="card-title text-center">Worst selling items</h4>
                        </div>
                        <PieChart width={500} height={300} >
                            <Pie
                                data={worstSellingData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {
                                    worstSellingData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
                                }
                            </Pie>
                        </PieChart>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;
