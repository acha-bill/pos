import React, { useEffect, useState } from "react";
import { DateRangePicker } from "../../components";
import EditIcon from "@material-ui/icons/Edit";
import ReactTable from "react-table";
import apis from "../../apis/apis";
import RefreshIcon from "@material-ui/icons/Refresh";
import html2pdf from "html2pdf.js";
import Swal from "sweetalert2";
import Modal from "react-modal";

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
    borderRadius: "10px",
  },
};

const InventoryReport = (props) => {
  const [isDatePickerOPen, setDatePickerOpen] = useState(false);
  const [itemsData, setItemsData] = useState([]);
  const [filteredItemsData, setFilteredItemsData] = useState([]);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);

  function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

  useEffect(() => {
    getItems();
  }, []);

  const getItems = async () => {
    Swal.fire({
      title: "",
      text: `Crunching data... `,
      icon: "info",
      showConfirmButton: false,
    });
    Swal.showLoading();
    let items = await apis.itemApi.items();
    let categories = await getCategories();
    for (let i = 0; i < items.length; i++) {
      let cat = categories.find((c) => c._id === items[i].category);
      if (!cat) {
        cat = { name: "N/A" };
      }
      items[i].categoryName = cat.name;
    }
    setItemsData(items);
    setFilteredItemsData(items);
    Swal.close();
  };

  const handleSearchInput = (event) => {
    let key = event.target.value.toLowerCase();
    let filtered = itemsData.filter((i) => {
      return (
        i.name.toLowerCase().indexOf(key) >= 0 ||
        i.categoryName.toLowerCase().indexOf(key) >= 0
      );
    });
    setFilteredItemsData(filtered);
  };

  const getCategories = async () => {
    let categories = await apis.categoryApi.categories();
    return categories;
  };

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
      jsPDF: { unit: "cm", format: "A4", orientation: "landscape" },
    };
    var element = document.getElementById("print");
    html2pdf().set(opt).from(element).save();
    Swal.fire("Saved!", `report saved successfully`, "success");
    setPrintModalOpen(false);
  };

  return (
    <div>
      <div className="text-center mt-3 mb-2">
        <b>Inventory report : {new Date().toLocaleDateString()}</b>
      </div>

      <Modal
        isOpen={isPrintModalOpen}
        contentLabel="Dashboard"
        style={customStyles}
        shouldCloseOnOverlayClick={false}
      >
        <div>
          <div className="text-cent mt-3">
            <button
              onClick={() => setPrintModalOpen(false)}
              className="btn btn-danger"
            >
              Close
            </button>{" "}
            &nbsp; &nbsp;
            <button onClick={downloadClick} className="btn btn-primary">
              Print
            </button>
          </div>
          <div id="print">
            <div className="text-center mb-2">
              <h4>Office and Communication House Limbe</h4>
              <span>Inventory Report: {new Date().toLocaleDateString()}</span>
            </div>
            <table className="table table-bordered table-sm">
              <thead>
                <th>#</th>
                <th>Name</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Purchase Price</th>
                <th>Qty</th>
                <th>Min Retail</th>
                <th>Max Retail</th>
                <th>Min WholeSale</th>
                <th>Max WholeSale</th>
                <th>Min Stock</th>
              </thead>
              <tbody>
                {filteredItemsData.map((item, i) => {
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.barcode}</td>
                      <td>{item.categoryName}</td>
                      <td>{item.costPrice}</td>
                      <td>{item.purchasePrice}</td>
                      <td>{item.qty}</td>
                      <td>{item.minRetailPrice}</td>
                      <td>{item.maxRetailPrice}</td>
                      <td>{item.minWholeSalePrice}</td>
                      <td>{item.maxWholeSalePrice}</td>
                      <td>{item.minStock}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <div className="mb-2">
        <input
          type="text"
          className="text input"
          placeholder="search name or category"
          onChange={handleSearchInput}
        />
        <button
          onClick={() => setPrintModalOpen(true)}
          className="btn btn-primary ml-5"
        >
          Print
        </button>
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
            Header: "Name",
            accessor: "name",
          },
          {
            Header: "Barcode",
            accessor: "barcode",
          },
          {
            Header: "Category",
            accessor: "categoryName",
          },
          {
            Header: "Cost Price",
            accessor: "costPrice",
          },
          {
            Header: "Purchase Price",
            accessor: "purchasePrice",
          },
          {
            Header: "Qty",
            accessor: "qty",
          },
          {
            Header: "Min Retail Price",
            accessor: "minRetailPrice",
          },
          {
            Header: "Max Retail Price",
            accessor: "maxRetailPrice",
          },
          {
            Header: "Min wholesale Price",
            accessor: "minWholeSalePrice",
          },
          {
            Header: "Max wholesale Price",
            accessor: "maxWholeSalePrice",
          },
          {
            Header: "Min stock",
            accessor: "minStock",
          },
        ]}
      />
    </div>
  );
};

export default InventoryReport;
