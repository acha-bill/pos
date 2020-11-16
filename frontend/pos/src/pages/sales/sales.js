import React, { useState, useEffect } from 'react';
import { ActionModal } from "../../components";
import Print from "@material-ui/icons/Print";
import PeopleAltIcon from "@material-ui/icons/PeopleAlt";
import DeleteIcon from '@material-ui/icons/Delete';
import { Form } from 'react-bootstrap';
import apis from "../../apis/apis";
import Swal from "sweetalert2";
import { Typeahead } from 'react-bootstrap-typeahead';
import Switch from '@material-ui/core/Switch';
import { connect, useSelector } from 'react-redux';
import { setItems } from '../../redux/actions/itemActions';
import { setPrinters } from '../../redux/actions/printerActions';
import { setCustomers } from '../../redux/actions/customerActions'
import { setEmployees } from '../../redux/actions/employeeActions'
import { bindActionCreators } from 'redux';

import 'bootstrap/dist/css/bootstrap.min.css';
import './sales.css';

const Sales = (props) => {
  const { items, customers, printers } = props;
  const [price, setPrice] = useState(0);
  const [printPrice, setPrintPrice] = useState(0)
  const [quantity, setQuantity] = useState(1);
  const [printQuantity, setPrintQuantity] = useState(1)
  const [discount, setDiscount] = useState(0);
  const [printDiscount, setPritnDiscount] = useState(0)
  const [selectItem] = useState([]);
  const [products, setProducts] = useState([])
  const [prints, setPrints] = useState([])
  const [selectCustomer, setSelectCustomer] = useState([]);
  const [isNewCustomerModalVisible, setNewCustomerModalVisible] = useState(false)
  const [grandTotal, setGrandTotal] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [change, setChange] = useState(0);
  const [comment, setComment] = useState('');
  const [isPrintModalVisible, setPrintModalVisible] = useState(false)

  useEffect(() => {
    getItems();
    getCustomers();
    getEmployees();
    getPrinters();
  }, []);

  useEffect(() => {
    computeGrandTotal()
  }, [price, quantity, discount, printPrice, printQuantity, printDiscount])


  useEffect(() => {
  }, [props])

  const getItems = async () => {
    try {
      let res = await apis.itemApi.items();
      console.log(res);
      props.setItems(res)
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "error",
        text: e.message,
      });
    }
  }

  const getPrinters = async () => {
    try {
      let res = await apis.printerApi.printers()
      res = res.filter(p => !p.isRetired)
      props.setPrinters(res)
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "error",
        text: e.message,
      });
    }
  }

  const getCustomers = async () => {
    try {
      let res = await apis.customerApi.customers();
      props.setCustomers(res)
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "error",
        text: e.message,
      });
    }
  }

  const getEmployees = async () => {
    try {
      let res = await apis.employeeApi.employees();
      props.setEmployees(res);
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'error',
        text: e.message
      })
    }
  }

  const handleSearchInput = (e) => {
    let _product = products;

    let index = _product.findIndex((p) => p._id === e[0]._id);

    if (index > -1) {
      return Swal.fire({
        icon: 'error',
        title: 'Warning',
        text: 'This product is already in the list'
      })
    };

    let _items = [...items];
    let newProduct = _items.find((d) => d._id === e[0]._id);

    newProduct.lineItemPrice = 0;
    newProduct.lineItemDiscount = 0;
    newProduct.lineItemQty = 1;
    newProduct.lineItemTotal = 0;
    newProduct.isWholeSale = false;

    _product.push(newProduct);

    setProducts([..._product]);
  }

  const handleCustomerSearchInput = (e) => setSelectCustomer(e)

  const handlePriceInput = (e, id) => {
    let retailPrice;
    let index = products.findIndex(p => p._id === id);
    if (index > -1) {
      retailPrice = products[index].lineItemPrice = +e.target.value;
      let discount = products[index].lineItemDiscount;

      if (discount !== 0) {
        let total = retailPrice * products[index].lineItemQty * discount;
        products[index].lineItemTotal = total;
      } else {
        let total = retailPrice * products[index].lineItemQty;
        products[index].lineItemTotal = total;
      }

    };

    setPrice(retailPrice)
  }


  const handlePrintPriceInput = (e, id) => {
    let retailPrice;
    let index = prints.findIndex(p => p.id === id);
    if (index > -1) {
      retailPrice = prints[index].lineItemPrice = +e.target.value;
      let discount = prints[index].lineItemDiscount;

      if (discount !== 0) {
        let total = retailPrice * prints[index].lineItemQty * discount;
        prints[index].lineItemTotal = total;
      } else {
        let total = retailPrice * prints[index].lineItemQty;
        prints[index].lineItemTotal = total;
      }

    };

    setPrintPrice(retailPrice)
  }

  const handleQuantityInput = (e, id) => {
    let quantity;

    let index = products.findIndex(p => p._id === id);
    if (index > -1) {
      quantity = products[index].lineItemQty = +e.target.value;
      let discount = products[index].lineItemDiscount;

      // if (quantity > products[index].qty && !products[index].isSystem) {
      //   return Swal.fire({
      //     icon: 'error',
      //     title: 'Warning',
      //     text: `The Quantity of this product is more that what is in stock`
      //   })
      // }

      if (discount !== 0) {
        let total = (quantity * products[index].lineItemPrice) - discount;
        products[index].total = total;
      } else {
        let total = quantity * products[index].lineItemPrice;
        products[index].lineItemTotal = total;
      }
    };

    console.log('changed')
    setQuantity(quantity)
  }

  const handlePrintQtyInput = (e, id) => {
    let quantity;

    let index = prints.findIndex(p => p.id === id);
    if (index > -1) {
      quantity = prints[index].lineItemQty = +e.target.value;
      let discount = prints[index].lineItemDiscount;

      if (discount !== 0) {
        let total = (quantity * prints[index].lineItemPrice) - discount;
        prints[index].total = total;
      } else {
        let total = quantity * prints[index].lineItemPrice;
        prints[index].lineItemTotal = total;
      }
    };


    setPrintQuantity(quantity)
  }

  const handleDiscountInput = (e, id) => {

    let index = products.findIndex(p => p._id === id);

    if (index > -1) {
      products[index].lineItemDiscount = +e.target.value;

      let price = products[index].lineItemPrice;
      let discount = +e.target.value;
      let qty = products[index].lineItemQty;

      if (discount > price) {
        return Swal.fire({
          icon: 'error',
          title: 'Warning',
          text: 'Discount can not be greater than Retail price'
        })
      }
      let total = (price * qty) - discount;
      products[index].lineItemTotal = total;
    }

    setDiscount(e.target.value)
  }


  const handlePrintDiscountInput = (e, id) => {

    let index = prints.findIndex(p => p._id === id);

    if (prints > -1) {
      products[index].lineItemDiscount = +e.target.value;

      let price = prints[index].lineItemPrice;
      let discount = +e.target.value;
      let qty = prints[index].lineItemQty;

      if (discount > price) {
        return Swal.fire({
          icon: 'error',
          title: 'Warning',
          text: 'Discount can not be greater than Retail price'
        })
      }
      let total = (price * qty) - discount;
      prints[index].lineItemTotal = total;
    }

    setPritnDiscount(e.target.value)
  }

  const addPrint = (print) => {
    print.lineItemPrice = 0
    print.lineItemDiscount = 0
    print.lineItemQty = 1
    print.lineItemTotal = 0
    print.id = JSON.stringify(print)

    let ps = [...prints]
    if (ps.findIndex(p => p.id === print.id) >= 0) {
      return Swal.fire({
        icon: 'error',
        title: 'Warning',
        text: 'The exact print already exists'
      })
    }
    ps.push(print)
    setPrints(ps)
    console.log(ps)
  }

  const deleteItem = (id) => {
    let index = products.findIndex(p => p._id === id);

    if (index > -1) {
      products.splice(index, 1);
    }

    setProducts([...products]);
    computeGrandTotal()
  }

  const deletePrint = (id) => {
    let index = prints.findIndex(p => p.id === id);

    if (index > -1) {
      prints.splice(index, 1);
    }

    setPrints([...prints]);
    computeGrandTotal()
  }

  const handleAmountInput = (e) => {
    setAmountPaid(+e.target.value);

    setChange(e.target.value - grandTotal);
  }

  const handleCommentInput = (e) => setComment(e.target.value);

  const computeGrandTotal = () => {
    let productsTotal = 0;
    let printsTotal = 0

    if (products.length) {
      productsTotal = products.reduce((pre, cur) => pre + cur.lineItemTotal, 0);
    }

    if (prints.length) {
      printsTotal = prints.reduce((pre, cur) => pre + cur.lineItemTotal, 0);
    }

    let _grandTotal = productsTotal + printsTotal
    setGrandTotal(_grandTotal);
    setChange(amountPaid - _grandTotal)
  };

  const confirmSale = async () => {
    let hasError = false;
    let p;
    let message = ''
    for (let i = 0; i < products.length; i++) {
      p = products[i];

      if (p.isWholeSale) {
        if (p.lineItemPrice < p.minWholeSalePrice || p.lineItemPrice > p.maxWholeSalePrice) {

          message = `Retail price for ${p.name} should be between ${p.minWholeSalePrice} cfa and ${p.minWholeSalePrice} cfa`
          hasError = true;
        }
      } else {
        if (p.lineItemPrice < p.minRetailPrice || p.lineItemPrice > p.maxRetailPrice) {

          message = `Retail price for ${p.name} should be between ${p.minRetailPrice} cfa and ${p.maxRetailPrice} cfa`
          hasError = true;
        }
      }
      if (hasError) {
        let result = await Swal.fire({
          title: `Sell for ${p.lineItemPrice} cfa?`,
          icon: "warning",
          text: message,
          showCancelButton: true,
          confirmButtonText: "Yes, sell",
        })
        if (!result.isConfirmed) {
          return
        }
      }
    }

    for (let i = 0; i < prints.length; i++) {
      p = prints[i];
      console.log(p)

      if (p.lineItemPrice < p.printer.minRetailPrice || p.lineItemPrice > p.printer.maxRetailPrice) {

        message = `Retail price print: ${p.printer.name} should be between ${p.printer.minRetailPrice} cfa and ${p.printer.maxRetailPrice} cfa`
        hasError = true;
      }

      if (hasError) {
        let result = await Swal.fire({
          title: `Print for ${p.lineItemPrice} cfa?`,
          icon: "warning",
          text: message,
          showCancelButton: true,
          confirmButtonText: "Yes, sell",
        })
        if (!result.isConfirmed) {
          return
        }
      }
    }

    let lineItems = products.map((product) => {
      return {
        itemId: product._id,
        qty: product.lineItemQty,
        retailPrice: product.lineItemPrice,
        discount: product.lineItemDiscount,
        total: product.lineItemTotal,
        isWholeSale: product.isWholeSale,
        type: 'item'
      }
    });
    prints.forEach(print => {
      lineItems.push({
        printerId: print.printer._id,
        qty: print.lineItemQty,
        retailPrice: print.lineItemPrice,
        discount: print.lineItemDiscount,
        total: print.lineItemTotal,
        printDetail: {
          color: print.colorOption,
          description: print.description,
          quality: print.quality
        },
        type: 'print'
      })
    })

    // if (amountPaid === 0) {
    //   return Swal.fire({
    //     icon: 'error',
    //     title: 'Warning',
    //     text: `Total Amount to pay is required`
    //   })
    // }

    let obj = {
      lineItems,
      total: grandTotal,
      paid: amountPaid,
      change,
      comment,
      customerId: selectCustomer.length > 0 ? selectCustomer[0]._id : '',
    };

    if (obj.customerId === '' && obj.change < 0) {
      return Swal.fire({
        title: 'Error',
        text: 'A sale on credit must be assigned to a customer',
        icon: 'error'
      })
    }

    if (obj.change > 0) {
      obj.change = 0
    }

    console.log(obj);
    Swal.fire({
      title: 'Confirm sale',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, confirm sale'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let res = await apis.saleApi.addSale(obj);

          Swal.fire(
            'Success!',
            `Sale was successfully completed`,
            'success'
          ).then(() => {
            clearSale()
          })
          console.log(res)
        } catch (e) {
          console.log(e);
          Swal.fire({
            icon: 'error',
            title: 'error',
            text: 'Something unexpected happened'
          })
        }
      }
    })
  }

  const cancelSale = () => {
    Swal.fire({
      title: 'Alert',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel sale'
    }).then(async (result) => {
      if (result.isConfirmed) {
        clearSale()
      }
    });
  };

  const clearSale = () => {
    setProducts([]);
    setPrints([])
    setGrandTotal(0);
    setChange(0);
    setAmountPaid(0);
    setComment('');
    setSelectCustomer([]);
    getItems()
  };

  const addSystemItem = (item) => {
    let _product = products;

    items.forEach((i) => {
      if (i.name === item) {
        i.lineItemPrice = 0;
        i.lineItemDiscount = 0;
        i.lineItemQty = 1;
        i.lineItemTotal = 0;

        _product.push(i);

        setProducts([..._product]);
      }
    })
  };

  const setIsWholeSale = (id) => {
    let _product = products;
    let index = _product.findIndex((p) => p._id === id);

    if (index > -1) {
      if (_product[index].isWholeSale) {
        _product[index].isWholeSale = false;
      } else {
        _product[index].isWholeSale = true;
      }
    }

    setProducts([..._product])
  };

  return (
    <div className="d-flex justify-content-center align-items-center">
      <div className="d-flex" style={{ width: '90%' }}>
        <div className="" style={{ width: '70%' }}>
          <div className="row ml-0 my-3 band-header align-items-center">
            <div className="d-flex justify-content-end align-items-center w-50">
              <div className="mr-3 ml-3"><span>Find or Scan item</span></div>
              <div className="" style={{ flex: 1 }}>
                <Form.Group className="m-0">
                  <Typeahead
                    id="items-selector"
                    labelKey="name"
                    onChange={handleSearchInput}
                    options={items}
                    placeholder="Search or select items"
                    selected={selectItem}
                  />
                </Form.Group>
              </div>
            </div>
            <div className="col d-flex justify-content-end align-items-center">
              <button onClick={() => setPrintModalVisible(true)} className="btn btn-primary ml-2"><span className="mr-2"><Print style={{ fontSize: 20 }} /></span>Print</button>
              <button onClick={() => addSystemItem('Photocopy')} className="btn btn-primary ml-2"><span className="mr-2"><Print style={{ fontSize: 20 }} /></span>Photocopy</button>
              <button onClick={() => addSystemItem('Spiral')} className="btn btn-primary ml-2"><span className="mr-2"><Print style={{ fontSize: 20 }} /></span>Spiral</button>
              <button onClick={() => addSystemItem('Scan')} className="btn btn-primary ml-2"><span className="mr-2"><Print style={{ fontSize: 20 }} /></span>Scan</button>
            </div>
          </div>

          <div className="row ml-1">
            <h5>Items</h5>
            <table className="table table-striped">
              <thead className="items-table-header">
                <tr>
                  <th className="text-center">Delete</th>
                  <th className="text-center">Name</th>
                  <th className="text-center">Price</th>
                  <th className="text-center">Sale type</th>
                  <th className="text-center">Qty</th>
                  <th className="text-center">Discount</th>
                  <th className="text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {
                  products && products.map((product, key) => {
                    return (
                      <tr key={key} className="table-row">
                        <td onClick={() => deleteItem(product._id)} className="text-center text trash-icon"><DeleteIcon style={{ fontSize: 20 }} /></td>
                        <td className="text-center text" >{product.name}</td>
                        <td className="text-center">
                          <span className="mr-2">{product.isWholeSale ? product.minWholeSalePrice : product.minRetailPrice}</span>
                          <input className={"items-table-input input text"} value={product.lineItemPrice} min="1" type="number" onChange={(e) => handlePriceInput(e, product._id)} />
                          <span className="ml-2">{product.isWholeSale ? product.maxWholeSalePrice : product.maxRetailPrice}</span>
                        </td>
                        <td className="text-center">
                          <span style={{ fontSize: '12px' }}>whole sale ?</span>
                          <Switch
                            checked={product.isWholeSale}
                            onChange={() => setIsWholeSale(product._id)}
                            style={{ color: '#2980B9' }}
                            className="items-table-input text text-success"
                            name="checkedB"
                            inputProps={{ 'aria-label': 'primary checkbox' }}
                          />
                        </td>
                        <td className="text-center">
                          <input className={"items-table-input input text"} value={product.lineItemQty} min="1" type="number" onChange={(e) => handleQuantityInput(e, product._id)} />
                          <span className="ml-2" style={product.qty === 0 ? { color: 'red' } : { color: 'green' }}>
                            {product.isSystem ? null : product.qty === 0 ? 'out of stock' : product.qty}
                          </span>
                        </td>
                        <td className="text-center">
                          <input className={"items-table-input input text"} value={product.lineItemDiscount} min="0" type="number" onChange={(e) => handleDiscountInput(e, product._id)} />
                        </td>
                        <td className="text-center amt-text" >{product.lineItemTotal} XAF</td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>

            <hr />
            <h5>Print</h5>
            <table className="table table-striped">
              <thead className="items-table-header">
                <th className="text-center">Delete</th>
                <th className="text-center">Printer</th>
                <th className="text-center">Option</th>
                <th className="text-center">Description</th>
                <th className="text-center">Description</th>
                <th className="text-center">RetailPrice</th>
                <th className="text-center">Qty</th>
                <th className="text-center">Discount</th>
                <th className="text-center">Total</th>
              </thead>
              <tbody>
                {
                  prints && prints.map((print, key) => {
                    return (
                      <tr key={key} className="table-row">
                        <td onClick={() => deletePrint(print.id)} className="text-center text trash-icon"><DeleteIcon style={{ fontSize: 20 }} /></td>
                        <td className="text-center text" >{print.printer.name}</td>
                        <td className="text-center text" >{print.colorOption}</td>
                        <td className="text-center text" >{print.description}</td>
                        <td className="text-center text" >{print.quality}</td>
                        <td className="text-center">
                          <span className="mr-2">{print.printer.minRetailPrice}</span>
                          <input className={"items-table-input input text"} value={print.lineItemPrice} min="1" type="number" onChange={(e) => handlePrintPriceInput(e, print.id)} />
                          <span className="ml-2">{print.printer.maxRetailPrice}</span>
                        </td>
                        <td className="text-center">
                          <input className={"items-table-input input text"} value={print.lineItemQty} type="number" min="1" onChange={(e) => handlePrintQtyInput(e, print.id)} />
                        </td>
                        <td className="text-center">
                          <input className={"items-table-input input text"} value={print.lineItemDiscount} min="1" type="number" onChange={(e) => handleDiscountInput(e, print.id)} />
                        </td>
                        <td className="text-center amt-text" >{print.lineItemTotal} XAF</td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>

            {/* <hr />
            <h5>Photocopy</h5>
            <table className="table table-striped">
              <thead className="items-table-header">
                <th className="text-center">Delete</th>
                <th className="text-center">Name</th>
              </thead>
              <tbody></tbody>
            </table> */}
          </div>
        </div>

        <div className="items-side-bar my-3 ml-5 pb-4">
          <div className="mx-5 my-3">
            <Form.Group className="m-0">
              <Typeahead
                id="customer-selector"
                labelKey="name"
                onChange={handleCustomerSearchInput}
                options={customers}
                placeholder="Search or select customers"
                selected={selectCustomer}
              />
            </Form.Group>
            <button onClick={() => setNewCustomerModalVisible(true)} className="btn btn-primary btn-block mt-2">
              <PeopleAltIcon style={{ position: 'relative', bottom: '2' }} />
              <span className="h5 ml-2">New Customer</span>
            </button>
          </div>
          <div className="separator"></div>
          <div className="d-flex justify-content-between align-items-center mx-4">
            <div className="text">Total</div>
            <div className="amt-text">{grandTotal} XAF</div>
          </div>
          <div className="d-flex justify-content-between align-items-center mx-4 my-2">
            <div className="text">Paid</div>
            <input className={"input rounded w-50 px-2"} value={amountPaid} type="text" placeholder="amount" onChange={handleAmountInput} />
          </div>
          <div className="d-flex justify-content-between align-items-center mx-4">
            <div className="text">Change</div>
            <div className="amt-text">{change} XAF</div>
          </div>
          <div className="separator"></div>
          <div className="mx-4">
            <div className="text mb-2">Comments</div>
            <textarea className="input rounded w-100 text-sm-left" rows="5" value={comment} cols="50" onChange={handleCommentInput}></textarea>
          </div>
          <div className="d-flex justify-content-end align-items-center mr-3 mt-4" >
            <button onClick={() => cancelSale()} className="btn btn-danger mr-2"><span className="h5">Cancel</span></button>
            <button onClick={() => confirmSale()} className="btn btn-success mr-2"><span className="h5">Complete</span></button>
          </div>
        </div>

        {isNewCustomerModalVisible && (
          <NewCustomer
            setNewCustomerModalVisible={() => setNewCustomerModalVisible(false)}
            isNewCustomerModalVisible={isNewCustomerModalVisible}
            getCustomers={() => getCustomers()}
            customerInfo={(customer) => setSelectCustomer([customer])}
          />
        )}

        {isPrintModalVisible && (
          <NewPrint
            setPrintModalVisible={() => setPrintModalVisible(false)}
            addPrint={(print) => addPrint(print)}
            printers={printers}
          />
        )}
      </div>
    </div>
  );
};

const mapStateToProps = ({ item, customer, printer }) => {
  return {
    items: item.items,
    customers: customer.customers,
    printers: printer.printers,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ setCustomers, setItems, setEmployees, setPrinters }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Sales);

const NewCustomer = (props) => {
  const { setNewCustomerModalVisible, isNewCustomerModalVisible, getCustomers, customerInfo } = props;
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleNameInput = (e) => setName(e.target.value)
  const handlePhoneInput = (e) => setPhoneNumber(e.target.value)

  const handleCancleClick = () => {
    setName('')
    setNewCustomerModalVisible(false)
  }
  const handleSuccessClick = async () => {
    let obj = { name, phoneNumber }

    // console.log(obj);

    try {
      let res = await apis.customerApi.addCustomer(obj);
      // console.log(res)
      Swal.fire(
        'Created!',
        `customer: ${res.name} created successfully`,
        'success'
      )
      getCustomers()
      customerInfo(res)
      setNewCustomerModalVisible(false)
    } catch (e) {
      console.log(e);
      Swal.fire({
        icon: 'error',
        title: 'error',
        text: 'Something unexpected happened'
      })
    }
  }

  return (
    <ActionModal
      isVisible={isNewCustomerModalVisible}
      setIsVisible={() => setNewCustomerModalVisible(false)}
      title="New Customer">
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">Name</span></div>
          <input name="name" placeholder="name" value={name} onChange={handleNameInput} type="text" className={"w-75 form-control input"} />
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">PhoneNumber</span></div>
          <input name="phoneNumber" placeholder="6*** ****" value={phoneNumber} onChange={handlePhoneInput} type="text" className={"w-75 form-control input"} />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
        <button onClick={() => handleCancleClick()} className="btn btn-danger mr-2"><span
          className="h5 px-2">Cancel</span></button>
        <button onClick={() => handleSuccessClick()} className="btn btn-success mr-2"><span
          className="h5 px-2">Save</span></button>
      </div>
    </ActionModal>
  )
}

const NewPrint = (props) => {
  const { setPrintModalVisible, printers, addPrint } = props;
  const [selectedPrinter, setSelectedPrinter] = useState(printers[0])
  const [colorOption, setColorOption] = useState(selectedPrinter ? selectedPrinter.options[0] : null)
  const [description, setDescription] = useState("text")
  const [quality, setQuality] = useState("draft")

  const handleCancleClick = () => {
    setPrintModalVisible(false)
  }

  const handlePrinterSelectChange = (e) => {
    let p = printers.find(_p => _p._id === e.target.value)
    setSelectedPrinter(p)
  }
  const handleDescriptionSelect = (e) => {
    setDescription(e.target.value)
  }
  const handleQualitySelect = (e) => {
    setQuality(e.target.value)
  }
  const handleOptionSelect = (e) => {
    setColorOption(e.target.value)
  }

  const handleSuccessClick = async () => {
    let obj = {
      printer: selectedPrinter,
      colorOption,
      description,
      quality,
    }
    addPrint(obj)
    setPrintModalVisible(false)
  }

  return (
    <ActionModal
      isVisible={true}
      setIsVisible={() => setPrintModalVisible(false)}
      title="New Customer">
      <div className="mx-5 mb-3">
        {printers.length === 0 && <i>You don't have any printers</i>}
      </div>

      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">Printer</span></div>
          <select onChange={handlePrinterSelectChange} className={"w-75 form-control input"}>
            {printers.map((printer, i) => <option key={i} value={printer._id}>{printer.name}</option>)}
          </select>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">Option</span></div>
          <select onChange={handleOptionSelect} className={"w-75 form-control input"}>
            {selectedPrinter && selectedPrinter.options.map((op, i) => <option key={i} value={op}>{op}</option>)}
          </select>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">Description</span></div>
          <select onChange={handleDescriptionSelect} className={"w-75 form-control input"}>
            <option value="text">Text</option>
            <option value="picture">Picture</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">Quality</span></div>
          <select onChange={handleQualitySelect} className={"w-75 form-control input"}>
            <option value="draft">Draft</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
        <button onClick={() => handleCancleClick()} className="btn btn-danger mr-2"><span
          className="h5 px-2">Cancel</span></button>
        <button disabled={printers.length === 0} onClick={() => handleSuccessClick()} className="btn btn-success mr-2"><span
          className="h5 px-2">Save</span></button>
      </div>
    </ActionModal>
  )
}