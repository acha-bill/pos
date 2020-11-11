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

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}


const StockMovement = props => {
    const currentDate = new Date()
    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    const [startDate, setStartDate] = useState(startMonth)
    const [endDate, setEndDate] = useState(currentDate)
    const [rangeType, setRangeType] = useState("day")
    const [isDatePickerOPen, setDatePickerOpen] = useState(false)
    const [items, setItems] = useState([])
    const [movements, setStockMovements] = useState([])
    const [isPrintModalOpen, setPrintModalOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [filteredItems, setFilteredItems] = useState([])

    useEffect(() => {
        getItems()
    }, [])

    const getItems = async () => {
        let res = await apis.itemApi.items()
        res = res.filter(i => !i.isRetired)
        setItems(res)
        let _movements = []
        res.forEach(item => {
            if (item.stockMovements) {
                console.log(item.stockMovements)
                let mvnts = item.stockMovements.filter(m => startDate <= new Date(m.created_at) && new Date(m.created_at) <= endDate)
                mvnts = mvnts.map(m => {
                    m.item = item
                    return m
                })
                _movements.push(...mvnts)
            }
        })
        console.log(_movements)
        setStockMovements(_movements)
        setFilteredItems(_movements)
    }

    const handleSearch = (e) => {
        setSearch(e.target.value)
        let key = e.target.value.toLowerCase()
        let res = movements.filter(i => i.item.name.toLowerCase().indexOf(key) >= 0)
        setFilteredItems(res ? res : [])
    }

    const handleDatePickerSaved = (dates) => {
        let _startDate = new Date(dates.start);
        let _endDate = new Date(dates.end);
        if (dates.type === 'year') {
            _startDate = new Date(dates.start, 0)
            _endDate = new Date(dates.end, 12)
        }
        setStartDate(_startDate)
        setEndDate(_endDate)
        setRangeType(dates.type)
        setDatePickerOpen(false)
    }



    const downloadClick = () => {
        var d = new Date();
        var opt = {
            margin: 1,
            filename:
                "stock_moveent_report" +
                d.getFullYear() +
                pad(d.getMonth(), 2) +
                pad(d.getDay(), 2) +
                ".pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "cm", format: "A4", orientation: "portrait" }
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

    return (
        <div>
            <div className="text-center mt-2 mb-2">
                <h3>Stock Movements report</h3>
                <div className="mt-2 mb-2">
                    From {startDate.toLocaleDateString()} To:
                            {endDate.toLocaleDateString()}<button className="ml-2 btn btn-primary btn-sm" onClick={() => setDatePickerOpen(true)}><EditIcon style={{ fontSize: 20 }} /></button> &nbsp; <button className="btn btn-sm btn-primary" onClick={getItems}  ><RefreshIcon style={{ fontSize: 20 }}></RefreshIcon></button>
                    {isDatePickerOPen && <DateRangePicker label="dashboard" default="week" onClose={() => setDatePickerOpen(false)} onSave={handleDatePickerSaved}></DateRangePicker>}
                    <button onClick={() => setPrintModalOpen(true)} className="btn btn-primary ml-5">Print</button>
                </div>

            </div>
            <Modal
                isOpen={isPrintModalOpen}
                contentLabel="Stock movements"
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
                            <span>Photocopy report: {startDate.toLocaleDateString()} - {endDate.toLocaleTimeString()}</span>
                        </div>
                        <table className="table table-bordered table-sm">
                            <thead>
                                <th>#</th>
                                <th>Date</th>
                                <th>Item</th>
                                <th>Qty Before</th>
                                <th>Type</th>
                                <th>Qty added</th>
                                <th>Qty After</th>
                            </thead>
                            <tbody>
                                {filteredItems.map((p, i) => {
                                    return <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{new Date(p.created_at).toLocaleString()}</td>
                                        <td>{p.item.name}</td>
                                        <td>{p.currentQty}</td>
                                        <td>{p.type}</td>
                                        <td>{p.qty}</td>
                                        <td>{p.item.qty}</td>
                                    </tr>
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            <input type="text input" value={search} onChange={handleSearch} placeholder="search item name" />
            <ReactTable
                showPagination={true}
                showPageSizeOptions={false}
                minRows={0}
                data={filteredItems}
                defaultPageSize={10}
                style={{ textAlign: "center" }}
                loadingText="Loading data ..."
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
                        Header: "Item",
                        Cell: (row) => {
                            return <div>{row.original.item.name}</div>;
                        },
                    },
                    {
                        Header: "Qty Before",
                        accessor: "currentQty",
                    },
                    {
                        Header: "Type",
                        accessor: "type",
                    },
                    {
                        Header: "Qty added",
                        accessor: "qty",
                    },
                    {
                        Header: "Qty After",
                        Cell: (row) => {
                            return <div>{row.original.item.qty}</div>;
                        },
                    },
                ]} />
        </div>
    )
}

export default StockMovement