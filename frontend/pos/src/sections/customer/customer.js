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

const CustomerReport = props => {

  const currentDate = new Date()
  const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
  const [startDate, setStartDate] = useState(startMonth)
  const [endDate, setEndDate] = useState(currentDate)
  const [rangeType, setRangeType] = useState("day")
  const [isDatePickerOPen, setDatePickerOpen] = useState(false)
  const [customerData, setCustomerData] = useState([])
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
    getCustomers()
  }, [])

  function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

  const getCustomers = async () => {
    const res = await apis.customerApi.customers()

    let customers = res;
    customers = customers.map(customer => {
      let totalDepts = 0
      customer.debtPayments.forEach(db => {
        totalDepts += db.amount
      })
      customer.totalDepts = totalDepts
      customer.balance = customer.debt - customer.totalDepts
      return customer
    })

    setCustomerData(customers)
  }

  const downloadClick = () => {
    var d = new Date();
    var opt = {
      margin: 1,
      filename:
        "customers_report_" +
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
        <h3>Customer summary report</h3>
        <div className="mt-2 mb-2">
          From {startDate.toLocaleDateString()} To:
                            {endDate.toLocaleDateString()}<button className="ml-2 btn btn-primary btn-sm" onClick={() => setDatePickerOpen(true)}><EditIcon style={{ fontSize: 20 }} /></button> &nbsp; <button className="btn btn-sm btn-primary" onClick={getCustomers}  ><RefreshIcon style={{ fontSize: 20 }}></RefreshIcon></button>
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
              <span>Customer report: {startDate.toLocaleDateString()} - {endDate.toLocaleTimeString()}</span>
            </div>
            <table className="table table-bordered table-sm">
              <thead>
                <th>#</th>
                <th>Date</th>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Dept (XAF)</th>
                <th>Total Depts Paid</th>
                <th>Balance</th>
              </thead>
              <tbody>
                {customerData.map((customer, i) => {
                  return <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{new Date(customer.created_at).toLocaleString()}</td>
                    <td>{customer.name}</td>
                    <td>{customer.phoneNumber}</td>
                    <td>{customer.debt}</td>
                    <td>{customer.totalDepts}</td>
                    <td>{customer.balance}</td>
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
        data={customerData}
        defaultPageSize={10}
        style={{ textAlign: "center" }}
        loadingText="Loading Products ..."
        noDataText="No customers found"
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
            accessor: "name",
          },
          {
            Header: "Phone Number",
            accessor: "phoneNumber",
          },
          {
            Header: "Dept (XAF)",
            accessor: "debt",
          },
          {
            Header: "Total paid",
            accessor: "totalDepts",
          },
          {
            Header: "Balance",
            accessor: "balance",
          },

        ]} />
    </div>
  );
};



export default CustomerReport;
