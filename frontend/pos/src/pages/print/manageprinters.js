import React, { Component, useState } from 'react';
import ReactTable from "react-table-v6";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import SettingsInputComponentIcon from '@material-ui/icons/SettingsInputComponent'; import apis from '../../apis/apis';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setPrinters } from '../../redux/actions/printerActions'
import { ActionModal } from '../../components';
import ReplayIcon from '@material-ui/icons/Replay';
import Swal from "sweetalert2";
import AddIcon from "@material-ui/icons/Add";
import UndoIcon from '@material-ui/icons/Undo';

class ManagePrinters extends Component {
    constructor(props) {
        super(props)
        this.state = {
            active: 1,
            isEditModalVisible: false,
            selectedPrinter: null,
            isRefillMOdalVisible: false,
            isTonerModalVisible: false,
            isNewPrinterModalVisible: false,
        }
    }

    componentDidMount() {
        this.getAllPrinters()
    }

    getAllPrinters = async () => {
        let res = await apis.printerApi.printers()
        //res = res.filter(i => !i.isRetired)
        this.props.setPrinters(res)
    }

    setActive = (active) => {
        this.setState({ active })
    }
    editPrinter = (printer) => {
        this.setState({
            selectedPrinter: printer,
            isEditModalVisible: true
        })
    }
    reactivatePrinter = async (printer) => {
        try {
            let result = await Swal.fire({
                title: 'Are you sure?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, activate it!'
            })
            if (!result.isConfirmed) {
                return
            }
            await apis.printerApi.activatePrinter(printer._id)
            this.getAllPrinters()
        } catch (err) {
            return Swal.fire({
                title: 'Error',
                icon: 'error',
                text: 'Error deleting printer'
            })
        }
    }
    deletePrinter = async (printer) => {
        try {
            let result = await Swal.fire({
                title: 'Are you sure?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!'
            })
            if (!result.isConfirmed) {
                return
            }
            await apis.printerApi.deletePrinter(printer._id)
            this.getAllPrinters()
        } catch (err) {
            return Swal.fire({
                title: 'Error',
                icon: 'error',
                text: 'Error deleting printer'
            })
        }
    }
    refill = (printer) => {
        this.setState({
            selectedPrinter: printer,
            isRefillMOdalVisible: true
        })
    }
    toner = (printer) => {
        this.setState({
            selectedPrinter: printer,
            isTonerModalVisible: true
        })
    }
    handleNewPrinterClick = () => {
        this.setState({
            isNewPrinterModalVisible: true
        })
    }

    render() {
        let { printers } = this.props
        let { isEditModalVisible, selectedPrinter, isRefillMOdalVisible, isTonerModalVisible, isNewPrinterModalVisible } = this.state
        return (
            <div className="container">
                <div className="col d-flex justify-content-between align-items-center mb-3">
                    <div className="ml-2">
                        <h4>Printers</h4>
                    </div>
                    <div className="ml-2">
                        <button
                            className="btn btn-primary"
                            onClick={this.handleNewPrinterClick}
                        >
                            <AddIcon style={{ position: "relative", bottom: "2" }} />
                            <span className="ml-3">New Printer</span>
                        </button>
                    </div>
                </div>
                <ReactTable
                    showPagination={true}
                    showPageSizeOptions={false}
                    minRows={0}
                    data={printers}
                    defaultPageSize={10}
                    style={{ textAlign: "center" }}
                    loadingText="Loading Products ..."
                    noDataText="No printers found"
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
                            Header: "Min RetailPrice",
                            accessor: "minRetailPrice",
                        },
                        {
                            Header: "Max RetailPrice",
                            accessor: "maxRetailPrice",
                        },
                        {
                            Header: "Options",
                            Cell: (row) => {
                                return <div>{row.original.options.map((op, i) => <span>{op}, </span>)}</div>;
                            },
                        },
                        {
                            Header: "Actions",
                            Cell: (item) => {
                                return (
                                    <>
                                        {!item.original.isRetired ? <div> <span
                                            onClick={() => this.editPrinter(item.original)}
                                            className="mr-4 table-icons" title="edit"
                                        >
                                            <EditIcon style={{ fontSize: 20 }} />
                                        </span>
                                            <span
                                                onClick={() => this.refill(item.original)}
                                                className="mr-4 table-icons" title="refill"
                                            >
                                                <ReplayIcon style={{ fontSize: 20 }} />
                                            </span>
                                            <span
                                                onClick={() => this.toner(item.original)}
                                                className="mr-4 table-icons" title="toner"
                                            >
                                                <SettingsInputComponentIcon style={{ fontSize: 20 }} />
                                            </span>
                                            <span
                                                onClick={() => this.deletePrinter(item.original)}
                                                className="table-icons" title="deactivate"
                                            >
                                                <DeleteIcon style={{ fontSize: 20 }} />
                                            </span></div> : <div>Undeelete <span
                                                onClick={() => this.reactivatePrinter(item.original)}
                                                className="ml-4 table-icons" title="undelete"
                                            >
                                                <UndoIcon style={{ fontSize: 20 }} />
                                            </span></div>}
                                    </>
                                )
                            }
                        }
                    ]}
                />
                {isEditModalVisible && (
                    <EditPrinter
                        setEditModalVisible={() => this.setState({ isEditModalVisible: false })}
                        printer={selectedPrinter}
                        getAllPrinters={() => this.getAllPrinters()}
                    />
                )}
                {isRefillMOdalVisible && (
                    <RefillPrinter
                        setRefillModalVisible={() => this.setState({ isRefillMOdalVisible: false })}
                        printer={selectedPrinter}
                        getAllPrinters={() => this.getAllPrinters()}
                    />
                )}
                {isTonerModalVisible && (
                    <RefillToner
                        setTonerModalVisible={() => this.setState({ isTonerModalVisible: false })}
                        printer={selectedPrinter}
                        getAllPrinters={() => this.getAllPrinters()}
                    />
                )}
                {isNewPrinterModalVisible && (
                    <NewPrinter
                        setNewPrinterModalVisible={() => this.setState({ isNewPrinterModalVisible: false })}
                        getAllPrinters={() => this.getAllPrinters()}
                    />
                )}
            </div >
        );
    }
}


class RefillPrinter extends Component {
    constructor(props) {
        super(props)
        let { printer } = props
        this.state = {
            name: printer.name,
            color: "",
            quality: "",
            reference: "",
        }
    }

    handleColorSelect = (e) => this.setState({ color: e.target.value })
    hanndleQualityselect = (e) => this.setState({ quality: e.target.value })
    handleReference = (e) => this.setState({ reference: e.target.value })

    handleCancleClick = () => {
        this.props.setRefillModalVisible(false);
    };


    handleSuccessClick = async (id) => {
        let { color, reference, quality } = this.state;
        if (!reference) {
            return Swal.fire("Error", `Reference is required`, "error");
        }
        let obj = {
            color,
            quality,
            reference
        }

        try {
            await apis.printerApi.addRefill(id, obj)
            this.props.getAllPrinters()
            Swal.fire("Success", `refill registered successfully`, "success");
        } catch (err) {
            Swal.fire("Error", `Error adding refill`, "error");
        } finally {
            this.props.setRefillModalVisible(false)
        }
    }

    render() {
        const { setRefillModalVisible, printer } = this.props
        const { name, color, quality, reference } = this.state;
        return (
            <ActionModal
                isVisible={true}
                setIsVisible={() => setRefillModalVisible(false)}
                title="Refill Printer"
            >
                <div className="mx-5">
                    <h4 className="mb-3">{name}</h4>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Color</span>
                        </div>
                        <select className="form-control w-75" onChange={this.handleColorSelect}>
                            <option value="black" selected={color === "black"}>Black</option>
                            <option value="cyan" selected={color === "cyan"}>Cyan</option>
                            <option value="magenta" selected={color === "magenta"}>Magenta</option>
                            <option value="yellow" selected={color === "yellow"}>Yellow</option>
                            <option value="lightCyan" selected={color === "lightCyan"}>Light Cyan</option>
                            <option value="lightMagenta" selected={color === "lightMagenta"}>Light Magenta</option>
                        </select>
                    </div>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Quality</span>
                        </div>
                        <select className="form-control w-75" onChange={this.hanndleQualityselect}>
                            <option value="compatible" selected={quality === "compatible"}>Compatible</option>
                            <option value="original" selected={quality === "original"}>Original</option>
                            <option value="refill" selected={quality === "refill"}>Refill</option>
                        </select>
                    </div>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Reference</span>
                        </div>
                        <input
                            name="ref"
                            placeholder="reference"
                            value={reference}
                            onChange={this.handleReference}
                            type="text"
                            className={"w-75 form-control input"}
                        />
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
                    <button
                        onClick={() => this.handleCancleClick(false)}
                        className="btn btn-danger mr-2"
                    >
                        <span className="h5 px-2">Cancel</span>
                    </button>
                    <button
                        onClick={() => this.handleSuccessClick(printer._id)}
                        className="btn btn-success mr-2"
                    >
                        <span className="h5 px-2">Save</span>
                    </button>
                </div>

            </ActionModal>
        )
    }
}


class RefillToner extends Component {
    constructor(props) {
        super(props)
        let { printer } = props
        this.state = {
            name: printer.name,
            reference: "",
        }
    }

    handleReference = (e) => this.setState({ reference: e.target.value })

    handleCancleClick = () => {
        this.props.setTonerModalVisible(false);
    };


    handleSuccessClick = async (id) => {
        let { reference } = this.state;
        if (!reference) {
            return Swal.fire("Error", `Reference is required`, "error");
        }
        let obj = {
            reference
        }

        try {
            await apis.printerApi.addToner(id, obj)
            this.props.getAllPrinters()
            Swal.fire("Success", `toner registered successfully`, "success");
        } catch (err) {
            Swal.fire("Error", `Error adding refill`, "error");
        } finally {
            this.props.setTonerModalVisible(false)
        }
    }

    render() {
        const { setTonerModalVisible, printer } = this.props
        const { name, reference } = this.state;
        return (
            <ActionModal
                isVisible={true}
                setIsVisible={() => setTonerModalVisible(false)}
                title="Refill Toner"
            >
                <div className="mx-5">
                    <h4 className="mb-3">{name}</h4>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Reference</span>
                        </div>
                        <input
                            name="ref"
                            placeholder="reference"
                            value={reference}
                            onChange={this.handleReference}
                            type="text"
                            className={"w-75 form-control input"}
                        />
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
                    <button
                        onClick={() => this.handleCancleClick(false)}
                        className="btn btn-danger mr-2"
                    >
                        <span className="h5 px-2">Cancel</span>
                    </button>
                    <button
                        onClick={() => this.handleSuccessClick(printer._id)}
                        className="btn btn-success mr-2"
                    >
                        <span className="h5 px-2">Save</span>
                    </button>
                </div>

            </ActionModal>
        )
    }
}


class NewPrinter extends Component {
    constructor(props) {
        super(props)
        this.state = {
            name: '',
            minRetailPrice: 0,
            maxRetailPrice: 0,
            options: [],
            bwOption: false,
            colorOption: false,
        }
    }

    handleNameInput = (e) => this.setState({ name: e.target.value })
    handleMinRetailPrice = (e) => this.setState({ minRetailPrice: Number(e.target.value) })
    handleMaxRetailPrice = (e) => this.setState({ maxRetailPrice: Number(e.target.value) })
    bwOptionChanged = (e) => this.setState({ bwOption: e.target.checked })
    colorOptionChanged = (e) => this.setState({ colorOption: e.target.checked })

    handleCancleClick = () => {
        this.props.setNewPrinterModalVisible(false);
    };

    handleSuccessClick = async (id) => {
        let { name, minRetailPrice, maxRetailPrice, bwOption, colorOption } = this.state;
        if (!name) {
            return Swal.fire("Error", `name is required`, "error");
        }
        let obj = {
            name,
            minRetailPrice,
            maxRetailPrice,
            options: []
        }
        if (bwOption) {
            obj.options.push("bw")
        }
        if (colorOption) {
            obj.options.push("color")
        }
        if (obj.options.length === 0) {
            return Swal.fire({
                title: 'Error',
                icon: 'error',
                text: 'At least 1 option is required'
            })
        }

        try {
            await apis.printerApi.addPrinter(obj)
            this.props.getAllPrinters()
            Swal.fire("Success", `pritner created successfully`, "success");
        } catch (err) {
            Swal.fire("Error", `Error adding printer`, "error");
        } finally {
            this.props.setNewPrinterModalVisible(false)
        }
    }

    render() {
        const { setNewPrinterModalVisible } = this.props
        const { name, minRetailPrice, maxRetailPrice, bwOption, colorOption } = this.state;
        return (
            <ActionModal
                isVisible={true}
                setIsVisible={() => setNewPrinterModalVisible(false)}
                title="New Printer"
            >
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Name</span>
                        </div>
                        <input
                            name="ref"
                            placeholder="reference"
                            value={name}
                            onChange={this.handleNameInput}
                            type="text"
                            className={"w-75 form-control input"}
                        />
                    </div>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Min Retail Price</span>
                        </div>
                        <input
                            name="min"
                            placeholder="min retail price"
                            value={minRetailPrice}
                            onChange={this.handleMinRetailPrice}
                            type="number"
                            className={"w-75 form-control input"}
                        />
                    </div>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Max Retail Price</span>
                        </div>
                        <input
                            name="max"
                            placeholder="max retail price"
                            value={maxRetailPrice}
                            onChange={this.handleMaxRetailPrice}
                            type="number"
                            className={"w-75 form-control input"}
                        />
                    </div>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Options</span>
                        </div>
                        <div>
                            <input
                                checked={bwOption}
                                type="checkbox"
                                className="mr-3"
                                onChange={this.bwOptionChanged}
                            />Black and White<br />
                            <input
                                checked={colorOption}
                                type="checkbox"
                                onChange={this.colorOptionChanged}
                                className="mr-3"
                            />Color
                        </div>
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
                    <button
                        onClick={() => this.handleCancleClick(false)}
                        className="btn btn-danger mr-2"
                    >
                        <span className="h5 px-2">Cancel</span>
                    </button>
                    <button
                        onClick={() => this.handleSuccessClick()}
                        className="btn btn-success mr-2"
                    >
                        <span className="h5 px-2">Save</span>
                    </button>
                </div>

            </ActionModal>
        )
    }
}


class EditPrinter extends Component {
    constructor(props) {
        super(props)
        let { printer } = props
        this.state = {
            name: printer.name,
            minRetailPrice: printer.minRetailPrice,
            maxRetailPrice: printer.maxRetailPrice,
            bwOption: printer.options.indexOf("bw") >= 0,
            colorOption: printer.options.indexOf("color") >= 0,
        }
    }

    handleNameInput = (e) => this.setState({ name: e.target.value });
    handleMinRetailPrice = (e) => this.setState({ minRetailPrice: e.target.value });
    handleMaxRetailPrice = (e) => this.setState({ maxRetailPrice: e.target.value });
    handleBWSelect = (e) => this.setState({ bwOption: e.target.checked })
    handleColorSelect = (e) => this.setState({ colorOption: e.target.checked })

    handleCancleClick = () => {
        this.props.setEditModalVisible(false);
    };
    handleSuccessClick = async (id) => {
        let { name, minRetailPrice, maxRetailPrice, bwOption, colorOption } = this.state;
        if (!name) {
            Swal.fire("Failure", `name is required`, "error");
        }
        let obj = {
            name,
            minRetailPrice: Number(minRetailPrice),
            maxRetailPrice: Number(maxRetailPrice),
            options: []
        }
        if (bwOption) {
            obj.options.push("bw")
        }
        if (colorOption) {
            obj.options.push("color")
        }

        if (obj.options.length === 0) {
            return Swal.fire({
                title: 'error',
                text: 'Atleast 1 option is required',
                icon: 'error'
            })
        }

        try {
            await apis.printerApi.editPRinter(id, obj)
            this.props.getAllPrinters()
            Swal.fire("Success", `printer updated`, "success");

        } catch (err) {
            Swal.fire("Error", `Error updating printer`, "error");
        } finally {
            this.props.setEditModalVisible(false)
        }
    }

    render() {
        const { setEditModalVisible, printer } = this.props
        const { name, minRetailPrice, maxRetailPrice, bwOption, colorOption } = this.state;
        return (
            <ActionModal
                isVisible={true}
                setIsVisible={() => setEditModalVisible(false)}
                title="Edit Printer"
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
                            onChange={this.handleNameInput}
                            type="text"
                            className={"w-75 form-control input"}
                        />
                    </div>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Min Retail Price</span>
                        </div>
                        <input
                            name="name"
                            placeholder="name"
                            value={minRetailPrice}
                            onChange={this.handleMinRetailPrice}
                            type="number"
                            className={"w-75 form-control input"}
                        />
                    </div>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Max Retail Price</span>
                        </div>
                        <input
                            name="name"
                            placeholder="name"
                            value={maxRetailPrice}
                            onChange={this.handleMaxRetailPrice}
                            type="number"
                            className={"w-75 form-control input"}
                        />
                    </div>
                </div>
                <div className="mx-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <span className="w-25 text h6">Options</span>
                        </div>
                        <div>
                            <input type="checkbox" checked={bwOption} onChange={this.handleBWSelect} className="mr-3" />Black and White <br />
                            <input type="checkbox" checked={colorOption} onChange={this.handleColorSelect} className="mr-3" />Color
                        </div>
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
                    <button
                        onClick={() => this.handleCancleClick(false)}
                        className="btn btn-danger mr-2"
                    >
                        <span className="h5 px-2">Cancel</span>
                    </button>
                    <button
                        onClick={() => this.handleSuccessClick(printer._id)}
                        className="btn btn-success mr-2"
                    >
                        <span className="h5 px-2">Save</span>
                    </button>
                </div>

            </ActionModal>
        )
    }
}

const mapStateToProps = ({ printer }) => {
    return {
        printers: printer.printers
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ setPrinters }, dispatch);
};


export default connect(mapStateToProps, mapDispatchToProps)(ManagePrinters);
