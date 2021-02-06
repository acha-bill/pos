import React, { useEffect, useState } from 'react';
import { DateRangePicker } from '../../components'
import EditIcon from '@material-ui/icons/Edit';
import ReactTable from 'react-table';
import apis from "../../apis/apis";
import RefreshIcon from '@material-ui/icons/Refresh';
import html2pdf from "html2pdf.js";
import Swal from 'sweetalert2';
import Modal from 'react-modal';


const customStyles = {
    content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        width: "90%",
        height: "90%",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        borderRadius: "10px"
    }
};

const SaleDetailsReport = props => {

    const currentDate = new Date()
    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    const [startDate, setStartDate] = useState(startMonth)
    const [endDate, setEndDate] = useState(currentDate)
    const [rangeType, setRangeType] = useState("day")
    const [isDatePickerOPen, setDatePickerOpen] = useState(false)
    const [itemsData, setItemsData] = useState([])
    const [filteredItemsData, setFilteredItemsData] = useState([])
    const [isPrintModalOpen, setPrintModalOpen] = useState(false)
    const [totalSale, setTotalSale] = useState(0)
    const [totalCost, setTotalCost] = useState(0)
    const [totalProfit, setTotalProfit] = useState(0)


    const handleDatePickerSaved = (dates) => {
        let _startDate = new Date(dates.start)
        let _endDate = new Date(dates.end)
        if (dates.type === 'year') {
            _startDate = new Date(dates.start, 0)
            _endDate = new Date(dates.end, 11)
        }
        if (dates.type === "day") {
            _startDate = new Date(`${dates.start}T${dates.startTime}`);
            _endDate = new Date(`${dates.end}T${dates.endTime}`);
        }
        if (dates.type === "month") {
            _startDate = new Date(dates.start.getFullYear(), dates.start.getMonth(), 1)

            _endDate = new Date(dates.start.getFullYear(), dates.start.getMonth(), 31)

        }
        setStartDate(_startDate)
        setEndDate(_endDate)
        setRangeType(dates.type)
        setDatePickerOpen(false)
    }

    useEffect(() => {
        getSales()
    }, [])

    function pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    const getSales = async () => {
        let _totalSale = 0
        let _totalProfit = 0
        let _totalCost = 0
        const res = await apis.saleApi.sales()
        let sales = res.filter(sale => {
            let saleDate = new Date(sale.created_at)
            return startDate <= saleDate && saleDate <= endDate
        })
        let items = []
        sales.forEach(sale => {
            let cost = 0
            sale.lineItems = sale.lineItems.map(i => {
                i.created_at = sale.created_at
                return i
            })
            sale.lineItems.forEach(li => {
                if (li.type === "item") {
                    cost += li.qty * li.item.purchasePrice
                    items.push(li)
                    _totalCost += cost
                    _totalSale += li.total
                    _totalProfit += li.total - cost
                }
            })
            return sale
        })
        items = items.sort((a, b) => {
            var aDate = new Date(a.created_at)
            var bDate = new Date(b.created_at)
            return bDate - aDate;
        })
        setItemsData(items)
        setFilteredItemsData(items)
        setTotalSale(_totalSale)
        setTotalCost(_totalCost)
        setTotalProfit(_totalProfit)
    }

    const downloadClick = () => {
        var d = new Date();
        var opt = {
            margin: 1,
            filename:
                "sales_report_" +
                d.getFullYear() +
                pad(d.getMonth(), 2) +
                pad(d.getDay(), 2) +
                ".pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "cm", format: "A4", orientation: "landscape" }
        };
        var element = document.getElementById("print");
        html2pdf()
            .set(opt)
            .from(element)
            .save();
        Swal.fire(
            'Saved!',
            `report saved successfully`,
            'success'
        )
        setPrintModalOpen(false)
    };

    const handleSearch = (event) => {
        let key = event.target.value.toLowerCase()
        let filtered = itemsData.filter(li => li.item.name.toLowerCase().indexOf(key) >= 0)
        setFilteredItemsData(filtered)
    }

    return (
        <div>
            <div className="text-center mt-2 mb-2">
                <h3>Product sales summary report</h3>
                <div className="mt-2 mb-2">
                    From {startDate.toLocaleDateString()} To:
                            {endDate.toLocaleDateString()}<button className="ml-2 btn btn-primary btn-sm" onClick={() => setDatePickerOpen(true)}><EditIcon style={{ fontSize: 20 }} /></button> &nbsp; <button className="btn btn-sm btn-primary" onClick={getSales}  ><RefreshIcon style={{ fontSize: 20 }}></RefreshIcon></button>
                    {isDatePickerOPen && <DateRangePicker label="dashboard" default="week" onClose={() => setDatePickerOpen(false)} onSave={handleDatePickerSaved}></DateRangePicker>}
                </div>

            </div>


            <Modal
                isOpen={isPrintModalOpen}
                contentLabel="Dashboard"
                style={customStyles}
                shouldCloseOnOverlayClick={false}>
                <div>
                    <div className="text-cent mt-3">
                        <button onClick={() => setPrintModalOpen(false)} className="btn btn-danger">Close</button> &nbsp; &nbsp;
            <button onClick={downloadClick} className="btn btn-primary">Print</button>
                    </div>
                    <div id="print">
                        <div className="text-center mb-2">
                            <h4>Office and Communication House Limbe</h4>
                            <span>Sales details report: {startDate.toLocaleDateString()} - {endDate.toLocaleTimeString()}</span>
                        </div>
                        <table className="table table-bordered table-sm">
                            <thead>
                                <th>#</th>
                                <th>Date</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Retail</th>
                                <th>Qty</th>
                                <th>Total (XAF)</th>
                                <th>Discount</th>
                                <th>Cost</th>
                                <th>Profit</th>
                            </thead>
                            <tbody>
                                {filteredItemsData.map((li, i) => {
                                    return <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{new Date(li.created_at).toLocaleString()}</td>
                                        <td>{li.item.name}</td>
                                        <td>{li.isWholeSale ? "whole sale" : "retail"}</td>
                                        <td>{li.retailPrice}</td>
                                        <td>{li.qty}</td>
                                        <td>{li.total}</td>
                                        <td>{li.discount}</td>
                                        <td>{li.qty * li.item.purchasePrice}</td>
                                        <td>{li.total - (li.qty * li.item.purchasePrice)}</td>
                                    </tr>
                                })}
                            </tbody>
                        </table>
                        <div className="text-center mt-3 mb-2">
                            <div>Total gross sale: <b>{totalSale} XAF</b></div>
                            <div>Total cost: <b>{totalCost} XAF</b></div>
                            <div>Total gross profit: <b>{totalProfit} XAF</b></div>
                        </div>
                    </div>
                </div>
            </Modal>

            <div className="mb-2">
                <input type="text" className="text input" placeholder="search item name" onChange={handleSearch} />
                <button onClick={() => setPrintModalOpen(true)} className="btn btn-primary ml-5">Print</button>
            </div>

            <ReactTable
                showPagination={true}
                showPageSizeOptions={false}
                minRows={0}
                data={filteredItemsData}
                defaultPageSize={10}
                style={{ textAlign: "center" }}
                loadingText="Loading Products ..."
                noDataText="No products found"
                className="-highlight -striped rt-rows-height ReactTable"
                columns={[
                    {
                        Header: "#",
                        id: "row",
                        maxWidth: 50,
                        filterable: false,
                        Cell: (row) => {
                            return <div>{row.index + 1}</div>;
                        },
                    },
                    {
                        Header: "Date",
                        Cell: (row) => {
                            return <div>{new Date(row.original.created_at).toLocaleString()}</div>;
                        },
                    },
                    {
                        Header: "Name",
                        Cell: (row) => {
                            return <div>{row.original.item.name}</div>;
                        },
                    },
                    {
                        Header: "Type",
                        Cell: (row) => {
                            return <div>{row.original.isWholeSale ? "whole sale" : "retail"}</div>;
                        },
                    },
                    {
                        Header: "Retail Price",
                        accessor: "retailPrice",
                    },
                    {
                        Header: "Qty",
                        accessor: "qty",
                    },
                    {
                        Header: "Total",
                        accessor: "total",
                    },
                    {
                        Header: "Discount",
                        accessor: "discount",
                    },
                    {
                        Header: "Cost",
                        Cell: (row) => {
                            return <div>{row.original.qty * row.original.item.purchasePrice}</div>;
                        },
                    },
                    {
                        Header: "Profit",
                        Cell: (row) => {
                            return <div>{row.original.total - (row.original.qty * row.original.item.purchasePrice)}</div>;
                        },
                    },
                ]} />
            <div className="text-center mt-3 mb-2">
                <div>Total gross sale: <b>{totalSale} XAF</b></div>
                <div>Total cost: <b>{totalCost} XAF</b></div>
                <div>Total gross profit: <b>{totalProfit} XAF</b></div>
            </div>
        </div>
    );
};



export default SaleDetailsReport;
