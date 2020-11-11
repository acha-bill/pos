import React, { useEffect, useState } from 'react';
import EditIcon from '@material-ui/icons/Edit';
import Swal from 'sweetalert2'
import { ActionModal } from '../../components';
import AddIcon from '@material-ui/icons/Add';
import VisibilityIcon from '@material-ui/icons/Visibility';
import ReactTable from 'react-table-v6'
import { connect } from 'react-redux';
import { setCustomers } from '../../redux/actions/customerActions';
import { bindActionCreators } from 'redux';
import PaymentIcon from '@material-ui/icons/Payment';
import apis from '../../apis/apis';

import "./customers.css";

const CustomersPage = (props) => {
  const { customers } = props;

  const [isNewCustomerModalVisible, setNewCustomerModalVisible] = useState(false)
  const [isEditCustomerModalVisible, setEditCustomerModalVisible] = useState(false)
  const [isPayDebtModalVisible, setPayDebtModalVisibile] = useState(false)
  const [isBasketDetailModalVisible, setBasketDetailModalVisible] = useState(false)
  const [isViewDebtPaymentsModalVisible, setViewDebtPaymentsModalVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [filteredCustomers, setFilterdCustomers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [basket, setBasket] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const [transactionIsLoading, setTransactionIsLoading] = useState(false);

  useEffect(() => {
    getCustomers();
  }, []);

  useEffect(() => {
  }, [props])

  const getCustomers = async () => {
    setIsLoading(false)

    try {
      let res = await apis.customerApi.customers();

      props.setCustomers(res);
      setFilterdCustomers(res)
      setIsLoading(false)
    } catch (e) {
      setIsLoading(false)
      Swal.fire({
        icon: 'error',
        title: 'error',
        text: e.message
      })
    }
  }

  const getTransactions = async (id) => {
    setTransactionIsLoading(false)

    try {
      let res = await apis.saleApi.getCustomerSales(id);

      console.log(res)
      setTransactionIsLoading(false)
      res.forEach(t => t.created_at = new Date(t.created_at).toDateString());

      setTransactions(res)
    } catch (e) {
      setTransactionIsLoading(false)
      Swal.fire({
        icon: 'error',
        title: 'error',
        text: e.message
      })
    }
  }

  const handleSearchInput = e => {
    if (!e) {
      setFilterdCustomers([...customers])
      return
    }
    let searchString = e.target.value.toLowerCase()
    let tmp = customers.filter(customer => {
      return customer.name.toLowerCase().indexOf(searchString) >= 0
    })
    setFilterdCustomers(tmp)
  }

  const editCustomer = (customer) => {
    setSelectedCustomer(customer);
    setEditCustomerModalVisible(true);
  }

  const viewTransactions = (customer) => {
    setSelectedCustomer(customer)
    getTransactions(customer._id)
  }

  const viewDebtPayments = (customer) => {
    setSelectedCustomer(customer)
    setViewDebtPaymentsModalVisible(true)
  }

  const viewBasketDetail = (basket) => {
    setBasket(basket)
    setBasketDetailModalVisible(true)
  }

  const payDebt = (customer) => {
    setSelectedCustomer(customer)
    setPayDebtModalVisibile(true)
  }

  return (
    <div>
      <div className="my-container-sm">
        <div className="row">
          <div className="col-md-7">
            <div className="row ml-0 my-3 d-flex justify-content-start align-items-center">
              <div className="w-50 d-flex justify-content-start align-items-center employees-header">
                <div className="mr-3 ml-3"><span className="h6">Name</span></div>
                <div className="w-50">
                  <input type="text" onChange={handleSearchInput} placeholder="search" name="search"
                    className={"form-control input"} />
                </div>
              </div>
              <div className="">
                <button onClick={() => setNewCustomerModalVisible(true)} className="btn btn-primary btn-block mx-3">
                  <AddIcon style={{ position: 'relative', bottom: '2' }} /><span className="h5 ml-3">New Customer</span>
                </button>
              </div>
            </div>

            {
              isLoading ?
                <div class="d-flex justify-content-center align-items-center">
                  <div class="spinner-border" style={{ width: "3rem", height: "3rem", color: '#2980B9' }} role="status">
                    <span class="sr-only">Loading...</span>
                  </div>
                </div>
                :
                <ReactTable
                  showPagination={true}
                  showPageSizeOptions={false}
                  minRows={0}
                  data={filteredCustomers}
                  defaultPageSize={10}
                  style={{ textAlign: 'center' }}
                  loadingText='Loading Products ...'
                  noDataText='No products found'
                  className="-highlight -striped rt-rows-height ReactTable"
                  columns={[
                    {
                      Header: "",
                      id: "row",
                      maxWidth: 50,
                      filterable: false,
                      Cell: (row) => {
                        return <div>{row.index + 1}</div>;
                      }
                    },
                    {
                      Header: "Name",
                      accessor: "name",
                      headerStyle: { textAlign: 'center' }

                    },
                    {
                      Header: "Phone",
                      accessor: "phoneNumber",
                      headerStyle: { textAlign: 'center' }
                    },
                    {
                      Header: "Debt (XAF)",
                      id: "debt",
                      headerStyle: { textAlign: 'center' },
                      maxWidth: 150,
                      Cell: customer => {
                        return (
                          <div>
                            <span>{customer.original.debt}</span>
                            {customer.original.debt > 0 && (<button onClick={() => payDebt(customer.original)} className="btn btn-success btn-sm ml-2">pay</button>)}
                          </div>
                        )
                      }
                    },
                    {
                      Header: 'Actions',
                      maxWidth: 150,
                      id: "actions",
                      Cell: customer => {
                        return (
                          <div>
                            <span onClick={() => viewTransactions(customer.original)} className="mr-4 table-icons"><VisibilityIcon style={{ fontSize: 20 }} /></span>
                            <span onClick={() => viewDebtPayments(customer.original)} className="mr-4 table-icons"><PaymentIcon style={{ fontSize: 20 }} /></span>
                            <span onClick={() => editCustomer(customer.original)} className="mr-4 table-icons"><EditIcon style={{ fontSize: 20 }} /></span>
                          </div>
                        )
                      }
                    }
                  ]}
                />
            }
            {isViewDebtPaymentsModalVisible && (
              <DebtPayments setViewDebtPaymentsModalVisible={() => setViewDebtPaymentsModalVisible(false)} isViewDebtPaymentsModalVisible={isViewDebtPaymentsModalVisible} customer={selectedCustomer} />
            )}

            {isNewCustomerModalVisible && (
              <NewCustomer
                setNewCustomerModalVisible={() => setNewCustomerModalVisible(false)}
                isNewCustomerModalVisible={isNewCustomerModalVisible}
                getCustomers={() => getCustomers()}
              />
            )}
            {isEditCustomerModalVisible && (
              <EditCustomer
                setEditCustomerModalVisible={() => setEditCustomerModalVisible(false)}
                isEditCustomerModalVisible={isEditCustomerModalVisible}
                customer={selectedCustomer}
                getCustomers={() => getCustomers()}
              />
            )}
            {isPayDebtModalVisible && (
              <PayDebt
                setPayDebtModalVisibile={() => setPayDebtModalVisibile(false)}
                isPayDebtModalVisible={isPayDebtModalVisible}
                customer={selectedCustomer}
                getCustomers={() => getCustomers()}
              />
            )}
            {isBasketDetailModalVisible && (
              <BasketDetail setBasketDetailModalVisible={() => setBasketDetailModalVisible(false)} isBasketDetailModalVisible={isBasketDetailModalVisible} basket={basket} />
            )}
          </div>
          <div className="col-md-5">
            <div className="pd">
              {!selectedCustomer && (<span>Transactions for selected customer will show here</span>)}
              {selectedCustomer && (<span>Transactions for: {selectedCustomer.name} </span>)}

              {
                transactionIsLoading ?
                  <div class="d-flex justify-content-center align-items-center">
                    <div class="spinner-border" style={{ width: "3rem", height: "3rem", color: '#2980B9' }} role="status">
                      <span class="sr-only">Loading...</span>
                    </div>
                  </div>
                  :
                  <ReactTable
                    showPagination={true}
                    showPageSizeOptions={false}
                    minRows={0}
                    data={transactions}
                    defaultPageSize={10}
                    style={{ textAlign: 'center' }}
                    loadingText='Loading transactions ...'
                    noDataText='No transactions found'
                    className="-highlight -striped rt-rows-height ReactTable"
                    columns={[
                      {
                        Header: "",
                        id: "row",
                        maxWidth: 50,
                        filterable: false,
                        Cell: (row) => {
                          return <div>{row.index + 1}</div>;
                        }
                      },
                      {
                        Header: "Date",
                        accessor: "created_at",
                        headerStyle: { textAlign: 'left' }
                      },
                      {
                        Header: "Total (XAF)",
                        accessor: "total",
                        headerStyle: { textAlign: 'left' }
                      },
                      {
                        Header: '',
                        maxWidth: 100,
                        id: "actions",
                        Cell: customer => {
                          return (
                            <div>
                              <span onClick={() => viewBasketDetail(customer.original)} className="mr-4 table-icons"><VisibilityIcon style={{ fontSize: 20 }} /></span>
                            </div>
                          )
                        }
                      }
                    ]}
                  />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = ({ customer }) => {
  return {
    customers: customer.customers,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ setCustomers }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomersPage);

const NewCustomer = (props) => {
  const { setNewCustomerModalVisible, isNewCustomerModalVisible, getCustomers } = props;
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


const EditCustomer = (props) => {
  const { setEditCustomerModalVisible, isEditCustomerModalVisible, customer, getCustomers } = props;
  const [name, setName] = useState(customer.name)
  const [phoneNumber, setPhoneNumber] = useState(customer.phoneNumber)

  const handleNameInput = (e) => setName(e.target.value)
  const handlePhoneInput = (e) => setPhoneNumber(e.target.value)

  const handleCancleClick = () => {
    setName('')
    setEditCustomerModalVisible(false)
  }
  const handleSuccessClick = async () => {
    let obj = { name, phoneNumber }

    try {
      let res = await apis.customerApi.editCustomer(customer._id, obj);
      Swal.fire(
        'Updated!',
        `customer: ${res.name} updated successfully`,
        'success'
      )
      getCustomers()
      setEditCustomerModalVisible(false)
      // console.log(res)
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
      isVisible={isEditCustomerModalVisible}
      setIsVisible={() => setEditCustomerModalVisible(false)}
      title="Edit Customer">
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">Name</span></div>
          <input name="name" placeholder="name" value={name} onChange={handleNameInput} type="text" className={"w-75 form-control input"} />
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">PhoneNumber</span></div>
          <input name="phoneNumber" placeholder="" value={phoneNumber} onChange={handlePhoneInput} type="text" className={"w-75 form-control input"} />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
        <button onClick={() => handleCancleClick()} className="btn btn-danger mr-2"><span
          className="h5 px-2">Cancel</span></button>
        <button onClick={() => handleSuccessClick()} className="btn btn-success mr-2"><span
          className="h5 px-2">Update</span></button>
      </div>
    </ActionModal>
  )
}

const DebtPayments = (props) => {
  const { customer, isViewDebtPaymentsModalVisible, setViewDebtPaymentsModalVisible } = props
  return (
    <ActionModal
      isVisible={isViewDebtPaymentsModalVisible}
      setIsVisible={() => setViewDebtPaymentsModalVisible(false)}
      title="debt payments">
      <ReactTable
        showPagination={false}
        showPageSizeOptions={false}
        minRows={0}
        data={customer.debtPayments}
        defaultPageSize={10}
        style={{ textAlign: 'center' }}
        className="-highlight -striped rt-rows-height ReactTable"
        columns={[
          {
            Header: "",
            id: "row",
            maxWidth: 50,
            filterable: false,
            Cell: (row) => {
              return <div>{row.index + 1}</div>;
            }
          },
          {
            Header: "Date",
            Cell: (row) => {
              return <div>{new Date(row.original.created_at).toLocaleDateString()}</div>;
            },
          },
          {
            Header: "Amount",
            accessor: "amount",
          },
          {
            Header: "Cashier",
            Cell: (row) => {
              return <div>{row.original.cashier.name}</div>;
            },
          }
        ]}
      />
    </ActionModal >
  )
}

const PayDebt = (props) => {
  const { setPayDebtModalVisibile, isPayDebtModalVisible, customer, getCustomers } = props;
  const [name, setName] = useState(customer.name)
  const [debt] = useState(customer.debt)
  const [amount, setAmount] = useState(0)
  const [balance, setBalance] = useState(0)

  const handleAmountInput = (e) => {
    setAmount(e.target.value)
    setBalance(debt - Number(e.target.value))
  }

  const handleCancleClick = () => {
    setName('')
    setPayDebtModalVisibile(false)
  }
  const handleSuccessClick = async () => {
    let obj = { amount: Number(amount) }
    let hasError = false;

    if (Number(amount) > debt) {
      hasError = true;
    };

    if (hasError) {
      return Swal.fire({
        icon: 'error',
        title: 'Warning',
        text: 'The amount entered is more than Dept'
      })
    }

    try {
      let res = await apis.customerApi.payCustomerDept(customer._id, obj);
      Swal.fire(
        'Updated!',
        `customer: ${res.name} paid dept successfully`,
        'success'
      )
      getCustomers()
      setPayDebtModalVisibile(false)
      // console.log(res)
    } catch (e) {
      console.log(e);
      return Swal.fire({
        icon: 'error',
        title: 'error',
        text: 'Something unexpected happened'
      })
    }
  }


  return (
    <ActionModal
      isVisible={isPayDebtModalVisible}
      setIsVisible={() => setPayDebtModalVisibile(false)}
      title="Pay Debt">
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <span className="w-25 text">Name:</span>
          <span>{name}</span>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <span className="w-25 text">Debt:</span>
          <span>{debt} XAF</span>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text">Amount</span></div>
          <input name="amount" placeholder="" value={amount} onChange={handleAmountInput} type="number" className={"w-75 form-control input"} />
        </div>
      </div>
      <div className="mx-5">
        <div><span className="w-25 text">Balance: {balance} XAF</span></div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
        <button onClick={() => handleCancleClick()} className="btn btn-danger mr-2"><span
          className="h5 px-2">Cancel</span></button>
        <button onClick={() => handleSuccessClick()} className="btn btn-success mr-2"><span
          className="h5 px-2">Pay</span></button>
      </div>
    </ActionModal >
  )
}

const BasketDetail = (props) => {
  const { setBasketDetailModalVisible, isBasketDetailModalVisible, basket } = props;
  const { created_at, total, cashier, lineItems, paid, change } = basket
  return (
    <ActionModal
      isVisible={isBasketDetailModalVisible}
      setIsVisible={() => setBasketDetailModalVisible(false)}
      title="Basket Details">
      <ReactTable
        showPagination={false}
        showPageSizeOptions={false}
        minRows={0}
        data={lineItems}
        defaultPageSize={10}
        style={{ textAlign: 'center' }}
        className="-highlight -striped rt-rows-height ReactTable"
        columns={[
          {
            Header: "",
            id: "row",
            maxWidth: 50,
            filterable: false,
            Cell: (row) => {
              return <div>{row.index + 1}</div>;
            }
          },
          {
            Header: "Item",
            Cell: (item) => {
              console.log('item', item.original.item.name)
              return <div>{item.original.item.name}</div>;
            }
          },
          {
            Header: "Retail Price",
            Cell: (item) => {
              return <div>{item.original.retailPrice}</div>;
            }
          },
          {
            Header: "Qty",
            accessor: "qty",
            headerStyle: { textAlign: 'left' }
          },
          {
            Header: "Discount",
            accessor: "discount",
            headerStyle: { textAlign: 'left' }
          },
          {
            Header: "Total (XAF)",
            accessor: "total",
            headerStyle: { textAlign: 'left' },
          }
        ]}
      />
      <div className="mx-5 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="w-25 text">Date:</span>
          <span>{new Date(created_at).toDateString()}</span>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="w-25 text">Total:</span>
          <span>{total} XAF</span>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="w-25 text">Cash:</span>
          <span>{paid} XAf</span>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="w-25 text">Balance:</span>
          <span>{change}</span>
        </div>
      </div>
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="w-25 text">Cashier:</span>
          <span>{cashier.name}</span>
        </div>
      </div>
    </ActionModal >
  )
}