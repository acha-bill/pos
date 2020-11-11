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

const PhotocopyReport = props => {

  const currentDate = new Date()
  const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
  const [startDate, setStartDate] = useState(startMonth)
  const [endDate, setEndDate] = useState(currentDate)
  const [rangeType, setRangeType] = useState("day")
  const [isDatePickerOPen, setDatePickerOpen] = useState(false)
  const [photocopyData, setphotocopyData] = useState([])
  const [isPrintModalOpen, setPrintModalOpen] = useState(false)

  const handleDatePickerSaved = (dates) => {
    let _startDate = new Date(`${dates.start}T${dates.startTime}`);
    let _endDate = new Date(`${dates.end}T${dates.endTime}`);
    if (dates.type === 'year') {
      _startDate = new Date(dates.start, 0)
      _endDate = new Date(dates.end, 12)
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
    let photocopies = [];
    let date = '';

    const res = await apis.saleApi.sales()
    let sales = res.filter(sale => {
      let saleDate = new Date(sale.created_at)
      date = startDate <= saleDate && saleDate <= endDate
      return date;
    })

    sales.forEach(sale => {
      sale.lineItems.forEach(li => {
        if (li.item.name === 'Photocopy') {
          li.created_at = date;
          photocopies.push(li)
        }
      })
    });

    setphotocopyData(photocopies);
  }

  const downloadClick = () => {
    var d = new Date();
    var opt = {
      margin: 1,
      filename:
        "photocopy_report_" +
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
        <h3>Photocopy summary report</h3>
        <div className="mt-2 mb-2">
          From {startDate.toLocaleDateString()} To:
                            {endDate.toLocaleDateString()}<button className="ml-2 btn btn-primary btn-sm" onClick={() => setDatePickerOpen(true)}><EditIcon style={{ fontSize: 20 }} /></button> &nbsp; <button className="btn btn-sm btn-primary" onClick={getSales}  ><RefreshIcon style={{ fontSize: 20 }}></RefreshIcon></button>
          {isDatePickerOPen && <DateRangePicker label="dashboard" default="week" onClose={() => setDatePickerOpen(false)} onSave={handleDatePickerSaved}></DateRangePicker>}
          <button onClick={() => setPrintModalOpen(true)} className="btn btn-primary ml-5">Print</button>
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
              <span>Photocopy report: {startDate.toLocaleDateString()} - {endDate.toLocaleTimeString()}</span>
            </div>
            <table className="table table-bordered table-sm">
              <thead>
                <th>#</th>
                <th>Date</th>
                <th>Qty</th>
                <th>Total(XAF)</th>
                <th>Retial Price (XAf)</th>
                <th>Discount</th>
                <th>Whole Sale</th>
              </thead>
              <tbody>
                {photocopyData.map((p, i) => {
                  return <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                    <td>{p.qty}</td>
                    <td>{p.total}</td>
                    <td>{p.retailPrice}</td>
                    <td>{p.discount}</td>
                    <td>{p.isWholeSale ? 'Yes' : 'No'}</td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <ReactTable
        showPagination={true}
        showPageSizeOptions={false}
        minRows={0}
        data={photocopyData}
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
            Header: "Qty",
            maxWidth: 50,
            accessor: "qty",
          },
          {
            Header: "Total (XAF)",
            accessor: "total",
          },
          {
            Header: "Retial Price (XAF)",
            accessor: "retailPrice",
          },
          {
            Header: "Discount",
            accessor: "discount",
          },
          {
            Header: "Whole Sale",
            Cell: (row) => {
              return <div>{row.original.isWholeSale ? 'Yes' : 'No'}</div>;
            },
          },
        ]} />
    </div>
  );
};



export default PhotocopyReport;
