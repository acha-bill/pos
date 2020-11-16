import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import GetAppIcon from "@material-ui/icons/GetApp";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteIcon from "@material-ui/icons/Delete";
import ReactTable from "react-table-v6";
import { ActionModal } from "../../components";
import BackupIcon from "@material-ui/icons/Backup";
import Swal from "sweetalert2";
import { ExcelRenderer } from "react-excel-renderer";
import CircularProgress from "@material-ui/core/CircularProgress";
import apis from "../../apis/apis";
import ReactExport from "react-export-excel";
import { connect } from 'react-redux';
import { setItems } from '../../redux/actions/itemActions';
import { bindActionCreators } from 'redux'
import { Link } from 'react-router-dom'
import Switch from '@material-ui/core/Switch';
import SyncAltIcon from '@material-ui/icons/SyncAlt';
import "./items.css";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const validateNumber = (n, field) => {
    n = Number(n);
    if (Number.isNaN(n)) {
        return `${field} is required to be a number`;
    }
};

const validateName = (name) => {
    return validateRequired(name, "Name");
};


const validateRequired = (n, field) => {
    if (n == null || n.toString() === "") {
        return `${field} is required`;
    }
};

const validateRequiredNumberNegative = (n, field) => {
    let err = validateRequired(n, field);
    if (err) return err;
    err = validateNumber(n, field);
    if (err) return err;
    return validateNegative(n, field);
};

const validateNegative = (n, field) => {
    n = Number(n);
    if (n < 0) {
        return `${field} is required to be postive`;
    }
};

const validateQty = (qty) => {
    return validateRequiredNumberNegative(qty, "Quantity");
};

const validateMinStockQty = (qty) => {
    return validateRequiredNumberNegative(qty, "Min Stock Qty");
};

const validateBarcode = (barcode) => {
    //return validateRequired(barcode, "Barcode");
};

const validateCostPrice = (cp) => {
    return validateRequiredNumberNegative(cp, "Costprice");
};

const validateMinRetailPrice = (mrp) => {
    return validateRequiredNumberNegative(mrp, "MinRetailprice");
};

const validatePurchasePrice = (mrp) => {
    return validateRequiredNumberNegative(mrp, "Purchase price");
};

const validateMaxRetailPrice = (mrp) => {
    return validateRequiredNumberNegative(mrp, "MaxRetailprice");
};

const validateMaxWholeSalePrice = (mrp) => {
    return validateRequiredNumberNegative(mrp, "MaxWholeSalePrice");
};

const validateMinWholeSalePrice = (mrp) => {
    return validateRequiredNumberNegative(mrp, "MinWholeSalePrice");
};

function Items(props) {
    const { items } = props
    let showLowStockDefault;
    if (props.location.state) {
        showLowStockDefault = props.location.state.showLowStock ? props.location.state.showLowStock : false;
    }
    const [isEditItemModalVisible, setEditItemModalVisible] = useState(false);
    const [isNewItemModalVisible, setNewItemModalVisible] = useState(false);
    const [isImportModalVisible, setImportModalVisible] = useState(false);
    const [isMoveStockModalVisible, setMoveStockModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [_items, setItems] = useState(items);
    const [categories, setCategories] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isloading, setLoading] = useState(false);
    const [exportItems, setExportItems] = useState([])
    const [lowStock, setLowStock] = useState(0);
    const [showLowStock, setShowLowStock] = useState(showLowStockDefault)

    useEffect(() => {
        getCategory().then((cats) => {
            getItems(cats);
        })
    }, []);


    useEffect(() => { }, [_items, filteredItems, props, lowStock])

    const getItems = async (cats) => {
        if (!cats) {
            cats = categories
        }
        setLoading(true);

        try {
            let res = await apis.itemApi.items();
            setItems(res);
            props.setItems(res)
            let nonRetiredItems = res.filter(item => !item.isRetired)
            setFilteredItems(nonRetiredItems);
            let _exportItems = nonRetiredItems.map(item => {
                let _item = { ...item }
                let cat = cats.find(c => c._id === _item.category)
                _item.category = cat ? cat.name : "N/A"
                return _item
            })
            let stock = 0;
            res.forEach((item) => {
                if (!item.isSystem && item.qty <= item.minStock && !item.isRetired) {
                    stock++;
                }
            })

            setLowStock(stock);
            setExportItems(_exportItems)
            setLoading(false);
        } catch (e) {
            setLoading(false);
            Swal.fire({
                icon: "error",
                title: "error",
                text: e.message,
            });
        }
    };

    const getCategory = async () => {
        setLoading(true);

        let res = []
        try {
            res = await apis.categoryApi.categories();

            setCategories(res);
        } catch (e) {
            setLoading(false);
            Swal.fire({
                icon: "error",
                title: "error",
                text: e.message,
            });
        }
        return res
    }

    const editItem = (item) => {
        setSelectedItem(item);
        setEditItemModalVisible(true);
    };

    const moveStock = (item) => {
        setSelectedItem(item)
        setMoveStockModalVisible(true)
    }

    const deleteItem = (item) => {
        Swal.fire({
            title: "Are you sure?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    let res = await apis.itemApi.deleteItem(item._id);
                    getItems()

                    Swal.fire(
                        'Deleted!',
                        `${item.name} was successfully deleted`,
                        'success'
                    )
                } catch (e) {
                    Swal.fire({
                        icon: 'error',
                        title: 'error',
                        text: 'Something unexpected happened'
                    })
                }
            }
        });
    };

    let nonRetiredItems = filteredItems.filter((item) => !item.isRetired);

    let lowStockItems = _items.filter((item) => !item.isSystem && item.qty <= item.minStock && !item.isRetired);


    const handleSearchInput = (e) => {
        if (!e) {
            setFilteredItems([...items]);
            return;
        }
        let searchString = e.target.value.toLowerCase();
        let tmp = items.filter((item) => {
            let cat = categories.find(c => c._id === item.category)
            return (
                !item.isRetired && (
                    item.name.toLowerCase().indexOf(searchString) >= 0 ||
                    item.barcode.toLowerCase().indexOf(searchString) >= 0 ||
                    (cat && cat.name.toLowerCase().indexOf(searchString) >= 0) ||
                    item.costPrice.toString().toLowerCase().indexOf(searchString) >= 0
                ));
        });
        setFilteredItems(tmp);
    };

    const handleNewItemClick = () => {
        setNewItemModalVisible(true);
    };

    const handleImportClick = () => {
        setImportModalVisible(true);
    };

    const showLowStockItems = () => {
        setShowLowStock(!showLowStock);
    }

    return (
        <div>
            <div className=" my-container-sm">
                <div className="ml-0 my-3 band-header align-items-center">
                    <div className="d-flex justify-content-end align-items-center">
                        <Switch
                            checked={showLowStock}
                            onChange={showLowStockItems}
                            style={{ color: '#dc3545' }}
                            name="checkedB"
                            inputProps={{ 'aria-label': 'primary checkbox' }}
                        />
                        Show Low Stock({lowStock})
                        <div>
                            <span className="mr-3 ml-3">Filter</span>
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="search"
                                onChange={handleSearchInput}
                                className="form-control"
                            />
                        </div>
                        <div className="col d-flex justify-content-end align-items-center">
                            <div className="ml-2">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleNewItemClick}
                                >
                                    <AddIcon style={{ position: "relative", bottom: "2" }} />
                                    <span className="ml-3">New Item</span>
                                </button>
                            </div>
                            <div className="ml-2">
                                <button className="btn btn-primary" onClick={handleImportClick}>
                                    <AttachFileIcon
                                        style={{ position: "relative", bottom: "2" }}
                                    />
                                    <span className="ml-3">Import Excel</span>
                                </button>
                            </div>
                            <div className="ml-2">
                                <button className="btn btn-primary btn-sm" >
                                    <Link to="/sample.xlsx" target="_blank" download className="download-btn">
                                        <GetAppIcon style={{ position: "relative", bottom: "2" }} />
                                        <span className="ml-3">Download sample</span>
                                    </Link>
                                </button>
                            </div>
                            <div className="ml-2">

                                <ExcelFile element={<button className="btn btn-primary">
                                    <BackupIcon style={{ position: "relative", bottom: "2" }} />
                                    <span className="ml-3">Export</span>
                                </button>}>
                                    <ExcelSheet data={exportItems} name="Items">
                                        <ExcelColumn label="Name" value="name" />
                                        <ExcelColumn label="Quantity" value="qty" />
                                        <ExcelColumn label="Barcode" value="barcode" />
                                        <ExcelColumn label="Category" value="category" />
                                        <ExcelColumn label="CostPrice" value="costPrice" />
                                        <ExcelColumn label="MinRetailPrice" value="minRetailPrice" />
                                        <ExcelColumn label="MaxRetailPrice" value="maxRetailPrice" />
                                        <ExcelColumn label="maxWholeSalePrice" value="maxWholeSalePrice" />
                                        <ExcelColumn label="minWholeSalePrice" value="minWholeSalePrice" />
                                        <ExcelColumn label="PurchasePrice" value="purchasePrice" />
                                        <ExcelColumn label="MinStockQty" value="minStock" />
                                    </ExcelSheet>
                                </ExcelFile>
                            </div>
                        </div>
                    </div>
                </div>

                <ReactTable
                    showPagination={true}
                    showPageSizeOptions={false}
                    minRows={0}
                    data={showLowStock ? lowStockItems : nonRetiredItems}
                    defaultPageSize={10}
                    style={{ textAlign: "center" }}
                    loadingText="Loading Products ..."
                    noDataText="No products found"
                    className="-highlight -striped rt-rows-height ReactTable"
                    columns={[
                        {
                            Header: "",
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
                            Header: "Quantity",
                            Cell: (row) => {
                                return (
                                    <div className={(!row.original.isSystem && row.original.qty <= row.original.minStock) ? 'lowQty' : ' '}>{row.original.qty}</div>
                                )
                            }
                        },
                        // {
                        //     Header: "Barcode",
                        //     accessor: "barcode",
                        // },
                        {
                            Header: "Category",
                            Cell: (row) => {
                                let cat = categories.find(c => c._id === row.original.category)
                                return <div>{cat ? cat.name : "N/A"}</div>;
                            },
                        },
                        {
                            Header: "Cost Price",
                            accessor: "costPrice",
                        },
                        {
                            Header: "Purchase Price",
                            accessor: "purchasePrice",
                        }, {
                            Header: "Min-Retail Price",
                            accessor: "minRetailPrice",
                        }, {
                            Header: "Max-Retail Price",
                            accessor: "maxRetailPrice",
                        }, {
                            Header: "Min-Stock Quantity",
                            accessor: "minStock",
                        },
                        {
                            Header: "Max-WholeSale Price",
                            maxWidth: 150,
                            accessor: "maxWholeSalePrice",
                        },
                        {
                            Header: "Min-WholeSale Quantity",
                            maxWidth: 150,
                            accessor: "minWholeSalePrice",
                        },
                        {
                            Header: "Actions",
                            id: "actions",
                            Cell: (item) => {
                                return (
                                    <div>
                                        <span
                                            onClick={() => editItem(item.original)}
                                            className="mr-4 table-icons"
                                        >
                                            <EditIcon style={{ fontSize: 20 }} />
                                        </span>

                                        {!item.original.isSystem && <span
                                            onClick={() => moveStock(item.original)}
                                            className="mr-4 table-icons"
                                        >
                                            <SyncAltIcon style={{ fontSize: 20 }} />
                                        </span>}

                                        {!item.original.isSystem &&
                                            <span
                                                onClick={() => deleteItem(item.original)}
                                                className="table-icons"
                                            >
                                                <DeleteIcon style={{ fontSize: 20 }} />
                                            </span>}

                                    </div>
                                );
                            },
                        },
                    ]}
                />
                {isNewItemModalVisible && (
                    <NewItem
                        setNewItemModalVisible={() => setNewItemModalVisible(false)}
                        isNewItemModalVisible={isNewItemModalVisible}
                        categories={categories}
                        getItems={() => getItems()}
                    />
                )}
                {isEditItemModalVisible && (
                    <EditItem
                        setEditItemModalVisible={() => setEditItemModalVisible(false)}
                        isEditItemModalVisible={isEditItemModalVisible}
                        getItems={() => getItems()}
                        categories={categories}
                        item={selectedItem}
                    />
                )}
                {isImportModalVisible && (
                    <ImportFile
                        setImportModalVisible={() => setImportModalVisible(false)}
                        isImportModalVisible={isImportModalVisible}
                        getItems={() => getItems()}
                        item={selectedItem}
                        categories={categories}
                        setCategories={setCategories}
                    />
                )}
                {isMoveStockModalVisible && (
                    <MoveStock
                        setMoveStockModalVisible={() => setMoveStockModalVisible(false)}
                        isMoveStockModalVisible={isMoveStockModalVisible}
                        item={selectedItem}
                        getItems={getItems}
                        setItems={setItems}
                    />
                )}
            </div>
        </div>
    );
}

const ImportFile = (props) => {
    const { setImportModalVisible, isImportModalVisible, getItems, categories, setCategories } = props;
    let [rows, setRows] = useState([]);
    const [isloading, setLoading] = useState(false);

    const handleCancleClick = () => {
        setImportModalVisible(false);
    };


    function sleep(n) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                return resolve();
            }, n * 1000);
        });
    }

    const handleSuccessClick = async (e) => {
        if (rows.length === 0) {
            return;
        }

        setLoading(true);
        await sleep(2);
        // api to update name

        let message;

        rows = rows.filter(row => row.length > 0)
        let itemsObjs = []
        for (let i = 1; i < rows.length; i++) {
            let itemObj = {};
            itemObj.name = rows[i][0]
            if (!itemObj.name) {
                itemObj.name = ""
            }
            let err = validateName(itemObj.name);
            if (err) {
                message = `${err} at row ${i} column ${0}`;
                break;
            }
            itemObj.name = itemObj.name.trim()
            itemObj.qty = rows[i][1];
            if (!itemObj.qty) {
                itemObj.qty = 0
            }
            err = validateQty(itemObj.qty);
            if (err) {
                message = `${err} at row ${i} column ${1}`;
                break;
            }

            itemObj.barcode = rows[i][2];
            if (!itemObj.barcode) {
                itemObj.barcode = ""
            }
            err = validateBarcode(itemObj.barcode);
            if (err) {
                message = `${err} at row ${i} column ${2}`;
                break;
            }
            itemObj.barcode = itemObj.barcode.trim()

            itemObj.category = rows[i][3];
            if (!itemObj.category) {
                itemObj.category = "General"
            }
            itemObj.category = itemObj.category.trim()
            itemObj.costPrice = rows[i][4];
            if (!itemObj.costPrice) {
                itemObj.costPrice = 0
            }
            err = validateCostPrice(itemObj.costPrice);
            if (err) {
                message = `${err} at row ${i} column ${4}`;
                break;
            }

            itemObj.purchasePrice = rows[i][5]
            if (!itemObj.purchasePrice) {
                itemObj.purchasePrice = 0
            }
            err = validatePurchasePrice(itemObj.purchasePrice, '"Purchase Price');
            if (err) {
                message = `${err} at row ${i} column ${5}`;
            }

            itemObj.minRetailPrice = rows[i][6]
            if (!itemObj.minRetailPrice) {
                itemObj.minRetailPrice = 0
            }
            err = validateMinRetailPrice(itemObj.minRetailPrice);
            if (err) {
                message = `${err} row ${i} column ${6}`;
            }

            itemObj.maxRetailPrice = rows[i][7];
            if (!itemObj.maxRetailPrice) {
                itemObj.maxRetailPrice = 0
            }
            err = validateMaxRetailPrice(itemObj.maxRetailPrice);
            if (err) {
                message = `${err} row ${i} column ${7}`;
            }

            itemObj.maxWholeSalePrice = rows[i][8];
            if (!itemObj.maxWholeSalePrice) {
                itemObj.maxWholeSalePrice = 0
            }
            err = validateMaxWholeSalePrice(itemObj.maxWholeSalePrice);
            if (err) {
                message = `${err} row ${i} column ${8}`;
            }

            itemObj.minWholeSalePrice = rows[i][9];
            if (!itemObj.minWholeSalePrice) {
                itemObj.minWholeSalePrice = 0
            }
            err = validateMinWholeSalePrice(itemObj.minWholeSalePrice);
            if (err) {
                message = `${err} row ${i} column ${9}`;
            }

            itemObj.minStock = rows[i][10]
            if (!itemObj.minStock) {
                itemObj.minStock = 0
            }
            err = validateMinStockQty(itemObj.minStock);
            if (err) {
                message = `${err} row ${i} column ${10}`;
            }

            itemsObjs.push(itemObj)
        }

        if (message) {
            Swal.fire("Failure", `${message}`, "error")
            setImportModalVisible(false)
            return
        }

        for (let i = 0; i < itemsObjs.length; i++) {
            let itemObj = itemsObjs[i]
            try {
                let _quantity;
                let _minRetailPrice;
                let _maxRetailPrice;
                let _purchasePrice
                let _minStock;
                let _costPrice = Number(itemObj.costPrice)
                let barcode = itemObj.barcode ? itemObj.barcode.toString() : ""

                itemObj.qty = itemObj.qty ? _quantity = Number(itemObj.qty) : ' ';
                _minRetailPrice = Number(itemObj.minRetailPrice);
                _maxRetailPrice = Number(itemObj.maxRetailPrice);
                _purchasePrice = Number(itemObj.purchasePrice);
                _minStock = Number(itemObj.minStockQty);
                let _minWholeSalePrice = Number(itemObj.minWholeSalePrice);
                let _maxWholeSalePrice = Number(itemObj.maxWholeSalePrice);

                let cat = null
                try {
                    cat = await apis.categoryApi.getCategoryByName(itemObj.category)
                } catch (e) {
                    // message = `category: ${itemObj.category} does not exist. Create it first. Row ${i}`;
                    // break;
                    try {
                        cat = await apis.categoryApi.addCategory({ name: itemObj.category })
                    } catch (e) {
                        message = `error creating new category: ${itemObj.category}`
                        break
                    }
                }

                await apis.itemApi.addItem({
                    "name": itemObj.name,
                    "qty": _quantity,
                    "barcode": barcode,
                    "category": cat._id,
                    "costPrice": _costPrice,
                    "purchasePrice": _purchasePrice,
                    "minRetailPrice": _minRetailPrice,
                    "maxRetailPrice": _maxRetailPrice,
                    "minStock": _minStock,
                    "minWholeSalePrice": _minWholeSalePrice,
                    "maxWholeSalePrice": _maxWholeSalePrice,
                    "isRetired": false
                });
            } catch (e) {
                setLoading(false)
                Swal.fire({
                    icon: "error",
                    title: "error",
                    text: e.message,
                });
                getItems()
                let allCats = await apis.categoryApi.categories()
                setCategories(allCats)
                setImportModalVisible(false);
                return
            }
        }
        getItems()
        let allCats = await apis.categoryApi.categories()
        setCategories(allCats)
        Swal.fire(
            "Created!",
            `Items uploaded successfully`,
            "success"
        );
        setImportModalVisible(false);
    };

    const handleFile = (event) => {
        let fileObj = event.target.files[0];

        ExcelRenderer(fileObj, (err, resp) => {
            if (err) {
                Swal.fire("Error", `${err}`, "Failure");
            } else {
                setRows(resp.rows);
            }
        });
    };

    return (
        <ActionModal
            isVisible={isImportModalVisible}
            setIsVisible={() => setImportModalVisible(false)}
            title="New Item"
        >
            {isloading ? (
                <div className="spinner">
                    <CircularProgress />
                </div>
            ) : (
                    <>
                        <div className="mx-5">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <span className="w-25 text h6">Import File</span>
                                </div>
                                <input
                                    name="name"
                                    placeholder="name"
                                    // value={name}
                                    onChange={handleFile}
                                    type="file"
                                    className={"w-75"}
                                    accept=".xls, .xlt, .xml, .xlsx, .xlsm "
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
                            <button
                                onClick={() => handleCancleClick(false)}
                                className="btn btn-danger mr-2"
                            >
                                <span className="h5 px-2">Cancel</span>
                            </button>
                            <button
                                onClick={() => handleSuccessClick()}
                                className="btn btn-success mr-2"
                            >
                                <span className="h5 px-2">Import</span>
                            </button>
                        </div>
                    </>
                )}
        </ActionModal>
    );

}


const NewItem = (props) => {
    const { setNewItemModalVisible, isNewItemModalVisible, getItems } = props;
    const [name, setName] = useState("");
    const [barcode, setBarcode] = useState("");
    const [costPrice, setCostPrice] = useState(0);
    const [category, setCategory] = useState("");
    const [quantity, setQuantity] = useState("");
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [minRetailPrice, setMinRetailPrice] = useState(0);
    const [maxRetailPrice, setMaxRetailPrice] = useState(0);
    const [minStockQty, setMinStockQty] = useState(0);
    const [maxWholeSalePrice, setMaxWholeSalePrice] = useState(0);
    const [minWholeSalePrice, setMinWholeSalePrice] = useState(0);

    const handleNameInput = (e) => setName(e.target.value);
    const handleBarcodeInput = (e) => setBarcode(e.target.value);
    const handleCostPriceInput = (e) => setCostPrice(e.target.value);
    const handleQuantityInput = (e) => setQuantity(e.target.value);
    const handleCategoryInput = (e) => setCategory(e.target.value);
    const handlePurchasePriceInput = (e) => setPurchasePrice(e.target.value);
    const handleminRetailPriceInput = (e) => setMinRetailPrice(e.target.value);
    const handlemaxRetailPriceInput = (e) => setMaxRetailPrice(e.target.value);
    const handleminStockInput = (e) => setMinStockQty(e.target.value);
    const handlemaxWholeSalePrice = (e) => setMaxWholeSalePrice(e.target.value);
    const handleminWholeSalePrice = (e) => setMinWholeSalePrice(e.target.value);

    const handleCancleClick = () => {
        setNewItemModalVisible(false);
    };

    const handleSuccessClick = async () => {
        let message;
        let err = validateName(name);
        if (err) {
            message = `${err}`;
        }

        err = validateQty(quantity, "Quantity");
        if (err) {
            message = `${err} `;
        }

        err = validateMinStockQty(minStockQty);
        if (err) {
            message = `${err} `;
        }

        err = validateCostPrice(costPrice);
        if (err) {
            message = `${err}`;
        }

        err = validatePurchasePrice(purchasePrice, '"Purchase Price');
        if (err) {
            message = `${err}`;
        }

        err = validateMinRetailPrice(minRetailPrice);
        if (err) {
            message = `${err}`;
        }

        err = validateMaxRetailPrice(maxRetailPrice);
        if (err) {
            message = `${err}`;
        }

        err = validateMaxWholeSalePrice(maxWholeSalePrice);
        if (err) {
            message = `${err}`;
        }

        err = validateMinWholeSalePrice(minWholeSalePrice);
        if (err) {
            message = `${err}`;
        }

        if (message) {
            Swal.fire("Failure", `${message}`, "error");
            return;
        }

        // handle error
        try {

            let _quantity = Number(quantity);
            let _costPrice = Number(costPrice)
            let _minRetailPrice = Number(minRetailPrice);
            let _maxRetailPrice = Number(maxRetailPrice);
            let _purchasePrice = Number(purchasePrice);
            let _minStock = Number(minStockQty);
            let _minWholeSalePrice = Number(minWholeSalePrice);
            let _maxWholeSalePrice = Number(maxWholeSalePrice);

            if (_quantity) {
                _quantity = Number(_quantity)
            }
            let res = await apis.itemApi.addItem({
                "name": name,
                "qty": _quantity,
                "barcode": barcode,
                "category": category,
                "costPrice": _costPrice,
                "purchasePrice": _purchasePrice,
                "minRetailPrice": _minRetailPrice,
                "maxRetailPrice": _maxRetailPrice,
                "minStock": _minStock,
                "minWholeSalePrice": _minWholeSalePrice,
                "maxWholeSalePrice": _maxWholeSalePrice,
                "isRetired": false
            });
            Swal.fire(
                "Created!",
                `Item: ${res.name} created successfully`,
                "success"
            );
            getItems()
            setNewItemModalVisible(false);
        } catch (e) {
            Swal.fire({
                icon: "error",
                title: "error",
                text: e.message,
            });
        }
        setNewItemModalVisible(false);

    };

    return (
        <ActionModal
            isVisible={isNewItemModalVisible}
            setIsVisible={() => setNewItemModalVisible(false)}
            title="New Item"
        >
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Name</span>
                    </div>
                    <input
                        name="name"
                        placeholder="name"
                        value={name}
                        onChange={handleNameInput}
                        type="text"
                        className={"w-75 form-control input"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Category</span>
                    </div>
                    <div class="categorySelect mb-3 w-75">
                        <select class="custom-select  " id="category" onChange={handleCategoryInput}>
                            {props.categories.map((cat) =>
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Barcode</span>
                    </div>
                    <input
                        name="barcode"
                        placeholder="barcode"
                        value={barcode}
                        onChange={handleBarcodeInput}
                        type="text"
                        className={"w-75 form-control input"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Cost Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="costPrice"
                        placeholder="0"
                        value={costPrice}
                        onChange={handleCostPriceInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Purchase Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="retailPrice"
                        placeholder="retailPrice"
                        value={purchasePrice}
                        onChange={handlePurchasePriceInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Min Retail Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="retailPrice"
                        placeholder="retailPrice"
                        value={minRetailPrice}
                        onChange={handleminRetailPriceInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Max Retail Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="retailPrice"
                        placeholder="retailPrice"
                        value={maxRetailPrice}
                        onChange={handlemaxRetailPriceInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Max WholeSale Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="retailPrice"
                        placeholder="retailPrice"
                        value={maxWholeSalePrice}
                        onChange={handlemaxWholeSalePrice}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Min WholeSale Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="retailPrice"
                        placeholder="retailPrice"
                        value={minWholeSalePrice}
                        onChange={handleminWholeSalePrice}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Quantity</span>
                    </div>
                    <input
                        name="qty"
                        placeholder="1"
                        value={quantity}
                        onChange={handleQuantityInput}
                        type="number"
                        className={"w-75 form-control input"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Min Stock Quantity</span>
                    </div>

                    <input
                        name="retailPrice"
                        placeholder="retailPrice"
                        value={minStockQty}
                        onChange={handleminStockInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
                <button
                    onClick={() => handleCancleClick(false)}
                    className="btn btn-danger mr-2"
                >
                    <span className="h5 px-2">Cancel</span>
                </button>
                <button
                    onClick={() => handleSuccessClick()}
                    className="btn btn-success mr-2"
                >
                    <span className="h5 px-2">Save</span>
                </button>
            </div>
        </ActionModal >
    );
};

const EditItem = (props) => {
    const { setEditItemModalVisible, isEditItemModalVisible, item, getItems } = props;
    const [name, setName] = useState(item.name);
    const [barcode, setBarcode] = useState(item.barcode);
    const [costPrice, setCostPrice] = useState(item.costPrice);
    const [category, setCategory] = useState(item.category);
    const [quantity, setQuantity] = useState(item.qty);
    const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice);
    const [minRetailPrice, setMinRetailPrice] = useState(item.minRetailPrice);
    const [maxRetailPrice, setMaxRetailPrice] = useState(item.maxRetailPrice);
    const [minStockQty, setMinStockQty] = useState(item.minStock);
    const [maxWholeSalePrice, setMaxWholeSalePrice] = useState(item.maxWholeSalePrice);
    const [minWholeSalePrice, setMinWholeSalePrice] = useState(item.minWholeSalePrice);

    const handleNameInput = (e) => setName(e.target.value);
    const handleBarcodeInput = (e) => setBarcode(e.target.value);
    const handleCostPriceInput = (e) => setCostPrice(e.target.value);
    const handleQuantityInput = (e) => setQuantity(e.target.value);
    const handleCategoryInput = (e) => setCategory(e.target.value);
    const handlePurchasePriceInput = (e) => setPurchasePrice(e.target.value);
    const handleminRetailPriceInput = (e) => setMinRetailPrice(e.target.value);
    const handlemaxRetailPriceInput = (e) => setMaxRetailPrice(e.target.value);
    const handleminStockInput = (e) => setMinStockQty(e.target.value);
    const handlemaxWholeSalePrice = (e) => setMaxWholeSalePrice(e.target.value);
    const handleminWholeSalePrice = (e) => setMinWholeSalePrice(e.target.value);

    const handleCancleClick = () => {
        setEditItemModalVisible(false);
    };

    const handleSuccessClick = async (e) => {
        let message;
        let err = validateName(name);
        if (err) {
            message = `${err}`;
        }

        err = validateQty(quantity, "Quantity");
        if (err) {
            message = `${err} `;
        }

        err = validateCostPrice(costPrice);
        if (err) {
            message = `${err}`;
        }

        err = validateMinStockQty(minStockQty);
        if (err) {
            message = `${err} `;
        }

        err = validatePurchasePrice(purchasePrice);
        if (err) {
            message = `${err}`;
        }

        err = validateMinRetailPrice(minRetailPrice);
        if (err) {
            message = `${err}`;
        }

        err = validateMaxRetailPrice(maxRetailPrice);
        if (err) {
            message = `${err}`;
        }

        err = validateMaxWholeSalePrice(maxWholeSalePrice);
        if (err) {
            message = `${err}`;
        }

        err = validateMinWholeSalePrice(minWholeSalePrice);
        if (err) {
            message = `${err}`;
        }

        if (message) {
            Swal.fire("Failure", `${message}`, "error");
            return;
        }

        // handle error
        try {

            let qtty;
            let costprice = Number(costPrice)
            let _minRetailPrice = Number(minRetailPrice);
            let _maxRetailPrice = Number(maxRetailPrice);
            let _purchasePrice = Number(purchasePrice);
            let _minStock = Number(minStockQty);
            let _minWholeSalePrice = Number(minWholeSalePrice);
            let _maxWholeSalePrice = Number(maxWholeSalePrice);

            if (quantity) {
                qtty = Number(quantity)
            }
            let res = await apis.itemApi.editItem(item._id, {
                "name": name,
                "qty": qtty,
                "barcode": barcode,
                "category": category,
                "costPrice": costprice,
                "purchasePrice": _purchasePrice,
                "minRetailPrice": _minRetailPrice,
                "maxRetailPrice": _maxRetailPrice,
                "minStock": _minStock,
                "minWholeSalePrice": _minWholeSalePrice,
                "maxWholeSalePrice": _maxWholeSalePrice,
                "isRetired": false
            });

            getItems()
            Swal.fire(
                "Updated!",
                `Item: ${res.name} updated successfully`,
                "success"
            );
            setEditItemModalVisible(false);
        } catch (e) {
            Swal.fire({
                icon: "error",
                title: "error",
                text: e.message,
            });
        }
        setEditItemModalVisible(false);
    };

    return (
        <ActionModal
            isVisible={isEditItemModalVisible}
            setIsVisible={() => setEditItemModalVisible(false)}
            title="Edit Item"
        >
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Name</span>
                    </div>
                    <input
                        name="name"
                        placeholder="name"
                        value={name}
                        disabled={item.isSystem}
                        onChange={handleNameInput}
                        type="text"
                        className={"w-75 form-control input"}
                    />
                </div>
            </div>
            {!item.isSystem && <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Category</span>
                    </div>
                    <div class="categorySelect mb-3 w-75">
                        <select class="custom-select" id="category" value={category} onChange={handleCategoryInput}>
                            {props.categories.map((cat) =>
                                <option key={cat._id} value={cat._id} selected={cat._id === category}>{cat.name}</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>}
            {!item.isSystem && <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Barcode</span>
                    </div>
                    <input
                        name="barcode"
                        placeholder="barcode"
                        value={barcode}
                        onChange={handleBarcodeInput}
                        type="text"
                        className={"w-75 form-control input"}
                    />
                </div>
            </div>}
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Cost Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="costPrice"
                        placeholder="0"
                        value={costPrice}
                        onChange={handleCostPriceInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>

            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Purchase Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name=" purchasePrice"
                        placeholder=" purchasePrice"
                        value={purchasePrice}
                        onChange={handlePurchasePriceInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Min Retail Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="minRetailPrice"
                        placeholder="minRetailPrice"
                        value={minRetailPrice}
                        onChange={handleminRetailPriceInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Max Retail Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="maxRetailPrice"
                        placeholder="maxRetailPrice"
                        value={maxRetailPrice}
                        onChange={handlemaxRetailPriceInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Max WholeSale Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="retailPrice"
                        placeholder="retailPrice"
                        value={maxWholeSalePrice}
                        onChange={handlemaxWholeSalePrice}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Min WholeSale Price</span>
                    </div>
                    <div class="input-group-prepend w-15">
                        <div class="input-group-text">XAF</div>
                    </div>
                    <input
                        name="retailPrice"
                        placeholder="retailPrice"
                        value={minWholeSalePrice}
                        onChange={handleminWholeSalePrice}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>
            {!item.isSystem && <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Quantity</span>
                    </div>
                    <input
                        name="qty"
                        placeholder="1"
                        value={quantity}
                        onChange={handleQuantityInput}
                        type="number"
                        className={"w-75 form-control input"}
                    />
                </div>
            </div>}
            {!item.isSystem && <div className="mx-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="w-25 text h6">Min Stock Quantity</span>
                    </div>

                    <input
                        name="minStockQty"
                        placeholder="minStockQty"
                        value={minStockQty}
                        onChange={handleminStockInput}
                        type="number"
                        className={"form-control input text"}
                    />
                </div>
            </div>}
            <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
                <button
                    onClick={() => handleCancleClick(false)}
                    className="btn btn-danger mr-2"
                >
                    <span className="h5 px-2">Cancel</span>
                </button>
                <button
                    onClick={() => handleSuccessClick(false)}
                    className="btn btn-success mr-2"
                >
                    <span className="h5 px-2">Save</span>
                </button>
            </div>
        </ActionModal>
    );
};

const MoveStock = (props) => {
    const { setMoveStockModalVisible, isMoveStockModalVisible, item, getItems } = props;
    const [movementType, setMovementType] = useState('in')
    const [qty, setQty] = useState(0)

    const stockMovementSelectChanged = (e) => {
        setMovementType(e.target.value)
    }
    const handleQtyChagned = (e) => {
        setQty(e.target.value)
    }

    const handleCancleClick = () => {
        setQty('')
        setMovementType('in')
        setMoveStockModalVisible(false)
    }
    const handleSuccessClick = async () => {
        if (movementType === "in") {
            if (Number(qty) < 0) {
                Swal.fire(
                    "Warning!",
                    `Stock IN requires a positive number`,
                    "error"
                );
                return
            }
        } else {
            if (Number(qty) > 0) {
                Swal.fire(
                    "Warning!",
                    `Stock OUT requires a negative number`,
                    "error"
                );
                return
            }
        }
        const obj = {
            qty: Number(qty),
            type: movementType
        }
        let res = await apis.itemApi.moveStock(item._id, obj)
        await getItems()
        Swal.fire(
            "Updated!",
            `Item: ${item.name} stock updated successfully`,
            "success"
        );
        setMoveStockModalVisible(false)
    }

    return (
        <ActionModal
            isVisible={isMoveStockModalVisible}
            setIsVisible={() => setMoveStockModalVisible(false)}
            title="Move stock"
        >
            <div className="form">
                <h5>Item: {item.name}</h5>
                <h5>Qty: {item.qty}</h5>
                <div className="form-group">
                    <label>Movement type</label>
                    <select className="form-control" onSelect={stockMovementSelectChanged} onChange={stockMovementSelectChanged}>
                        <option value="in">Stock In</option>
                        <option value="out">Stock out</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" value={qty} onChange={handleQtyChagned} />
                </div>
                <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
                    <button
                        onClick={() => handleCancleClick()}
                        className="btn btn-danger mr-2"
                    >
                        <span className="h5 px-2">Cancel</span>
                    </button>
                    <button
                        onClick={() => handleSuccessClick()}
                        className="btn btn-success mr-2"
                    >
                        <span className="h5 px-2">Save</span>
                    </button>
                </div>
            </div>
        </ActionModal>
    )
}

const mapStateToProps = ({ item }) => {
    return {
        items: item.items
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ setItems }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Items);
