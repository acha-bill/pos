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


const PrinterRefills = props => {
    const currentDate = new Date()
    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    const [startDate, setStartDate] = useState(startMonth)
    const [endDate, setEndDate] = useState(currentDate)
    const [rangeType, setRangeType] = useState("day")
    const [isDatePickerOPen, setDatePickerOpen] = useState(false)
    const [printers, setPrinters] = useState([])
    const [refills, setRefills] = useState([])
    const [isPrintModalOpen, setPrintModalOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [filteredItems, setFilteredItems] = useState([])

    useEffect(() => {
        getPrinterRefills()
    }, [])

    const getPrinterRefills = async () => {
        let res = await apis.printerApi.printers()
        res = res.filter(i => !i.isRetired)
        setPrinters(res)
        let _refills = []
        res.forEach(printer => {
            if (!printer.refills) {
                printer.refills = []
            }
            let refills = printer.refills.filter(m => startDate <= new Date(m.created_at) && new Date(m.created_at) <= endDate)
            refills = refills.map(r => {
                r.printer = printer
                return r
            })
            _refills.push(...refills)
        })
        setRefills(_refills)
        setFilteredItems(_refills)
    }

    const handleSearch = (e) => {
        setSearch(e.target.value)
        let key = e.target.value.toLowerCase()
        let res = refills.filter(r => r.printer.name.toLowerCase().indexOf(key) >= 0 ||
            r.color.toLowerCase().indexOf(key) >= 0 ||
            r.quality.toLowerCase().indexOf(key) >= 0 ||
            r.reference.toLowerCase().indexOf(key) >= 0)
        setFilteredItems(res ? res : [])
    }

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
            console.log(_startDate)
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
                "printer_refills_" +
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
                <h3>Printer Refills report</h3>
                <div className="mt-2 mb-2">
                    From {startDate.toLocaleDateString()} To:
                            {endDate.toLocaleDateString()}<button className="ml-2 btn btn-primary btn-sm" onClick={() => setDatePickerOpen(true)}><EditIcon style={{ fontSize: 20 }} /></button> &nbsp; <button className="btn btn-sm btn-primary" onClick={getPrinterRefills}  ><RefreshIcon style={{ fontSize: 20 }}></RefreshIcon></button>
                    {isDatePickerOPen && <DateRangePicker label="dashboard" default="week" onClose={() => setDatePickerOpen(false)} onSave={handleDatePickerSaved}></DateRangePicker>}
                    <button onClick={() => setPrintModalOpen(true)} className="btn btn-primary ml-5">Print</button>
                </div>

            </div>
            <Modal
                isOpen={isPrintModalOpen}
                contentLabel="printer refills"
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
                                <th>Printer</th>
                                <th>Color</th>
                                <th>Quality</th>
                                <th>Reference</th>
                            </thead>
                            <tbody>
                                {filteredItems.map((p, i) => {
                                    return <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{new Date(p.created_at).toLocaleString()}</td>
                                        <td>{p.printer.name}</td>
                                        <td>{p.color}</td>
                                        <td>{p.quality}</td>
                                        <td>{p.reference}</td>
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
                            return <div>{row.original.printer.name}</div>;
                        },
                    },
                    {
                        Header: "Color",
                        accessor: "color",
                    },
                    {
                        Header: "Quality",
                        accessor: "quality",
                    },
                    {
                        Header: "Reference",
                        accessor: "reference",
                    },
                ]} />
        </div>
    )
}

export default PrinterRefills