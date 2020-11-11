import React, { useEffect, useState } from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import Create from '@material-ui/icons/Create';
import PeopleAltIcon from "@material-ui/icons/PeopleAlt";
import { ActionModal } from '../../components';
import Swal from 'sweetalert2'
import ReactTable from 'react-table-v6'
import 'react-table-v6/react-table.css'
import apis from '../../apis/apis';
import { Form } from 'react-bootstrap';
import { connect } from 'react-redux';
import { setEmployees } from '../../redux/actions/employeeActions';
import { bindActionCreators } from 'redux';

import './employees.css'

const Employees = (props) => {
  const { employees } = props;
  const [editModal, setEditModalVisible] = useState(false)
  const [selectionUser, setSelectionUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const [newEmployeeModal, setNewEmployeeModalVisible] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [roles, setRoles] = useState([])

  useEffect(() => {
    getEmployees();
  }, []);

  useEffect(() => {
  }, [props])

  const getEmployees = async () => {
    setIsLoading(false)

    try {
      let res = await apis.employeeApi.employees();
      props.setEmployees(res);
      setFilteredEmployees(res.filter((e) => !e.isRetired))
      let roles = await apis.roleApi.roles()
      setRoles(roles)
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

  const handleSearchInput = (event) => {
    let str = ''
    if (event) {
      str = event.target.value.toLowerCase()
    }
    let nonRetiredEmployees = employees.filter((e) => !e.isRetired);
    let filteredEmployees = nonRetiredEmployees.filter(e =>
      e.name.toLowerCase().indexOf(str) >= 0 ||
      e.username.toLowerCase().indexOf(str) >= 0 ||
      e.phoneNumber.toLowerCase().indexOf(str) >= 0
    )
    setFilteredEmployees(filteredEmployees)
  }

  const deleteAlert = (employee) => {
    Swal.fire({
      title: 'Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let res = await apis.employeeApi.deleteEmployee(employee._id);
          getEmployees()
          Swal.fire(
            'Deleted!',
            `${employee.name} was successfully deleted`,
            'success'
          )
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
    })
  }

  const editEmplyee = (employee) => {
    setSelectionUser(employee);
    setEditModalVisible(true);
  }


  return (
    <div>
      <div className="container">
        <div className="row ml-0 my-3 d-flex justify-content-start align-items-center">
          <div className="w-50 d-flex justify-content-start align-items-center employees-header">
            <div className="mr-3 ml-3"><span className="h6">Name</span></div>
            <div className="w-50">
              <input type="text" onChange={handleSearchInput} placeholder="search" name="searchInput"
                className={"form-control input"} />
            </div>
          </div>
          <div className="">
            <button onClick={() => setNewEmployeeModalVisible(true)} className="btn btn-primary btn-block mx-3">
              <PeopleAltIcon style={{ position: 'relative', bottom: '2' }} /><span className="h5 ml-3">New Employee</span>
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
              data={filteredEmployees}
              columns={[
                {
                  Header: "Name",
                  accessor: "name",
                },
                {
                  Header: "User Name",
                  accessor: "username",
                },
                {
                  Header: "Phone",
                  accessor: "phoneNumber",
                  className: 'text-center'
                },
                {
                  Header: "Roles",
                  accessor: "role",
                  resizable: true,
                  Cell: props => {
                    return (
                      <div>
                        {props.original.roles &&
                          props.original.roles.map((id, index) => {
                            let _role = roles.find((role) => role._id === id);

                            return (
                              <>
                                {
                                  _role &&
                                  <span>
                                    {_role.name}
                                    {index < props.original.roles.length - 1 ? ', ' : ' '}
                                  </span>
                                }
                              </>
                            )
                          })}
                      </div>
                    )
                  }
                },
                {
                  Header: 'Actions',
                  id: "actions",
                  Cell: employee => {
                    return (
                      <div>
                        <span onClick={() => editEmplyee(employee.original)} className="mr-4 table-icons"><Create
                          style={{ fontSize: 20 }} /></span>
                        <span onClick={() => deleteAlert(employee.original)} className="table-icons"><DeleteIcon
                          style={{ fontSize: 20 }} /></span>
                      </div>
                    )
                  }
                }
              ]}
              defaultPageSize={10}
              style={{ textAlign: 'center' }}
              loadingText='Loading Products ...'
              noDataText='No products found'
              className="-highlight -striped rt-rows-height ReactTable"
            />
        }

        {
          editModal && (
            <EditEmplyee
              setEditModalVisible={() => setEditModalVisible(false)}
              editModal={editModal}
              user={selectionUser}
              listOfRoles={roles}
              getEmployees={() => getEmployees()}
            />
          )
        }

        {
          newEmployeeModal && (
            <NewEmployee
              setNewEmployeeModalVisible={() => setNewEmployeeModalVisible(false)}
              newEmployeeModal={newEmployeeModal}
              listOfRoles={roles}
              getEmployees={() => getEmployees()}
            />
          )
        }

      </div>
    </div>
  )
}

const NewEmployee = (props) => {
  const { setNewEmployeeModalVisible, newEmployeeModal, getEmployees, listOfRoles } = props;
  const [name, setName] = useState('')
  const [username, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [roles, setRoles] = useState([])

  useEffect(() => { }, [roles])

  const handleNameInput = event => {
    setName(event.target.value)
  }

  const handleUserNameInput = event => {
    setUserName(event.target.value)
  }

  const handlePasswordInput = event => {
    setPassword(event.target.value)
  }

  const handlePhoneInput = event => {
    setPhone(event.target.value)
  }

  const handleRoleInput = event => {
    setRole(event.target.value)
  }

  const handleCancleClick = () => {
    setName('')
    setNewEmployeeModalVisible(false)
  }

  const addToRoles = (name) => {
    let _roles = roles;
    let newRole = listOfRoles.find((role) => role.name === name);

    _roles.push(newRole);

    setRoles([..._roles]);
  }

  const deleteRole = (role) => {
    let index = roles.findIndex((r) => r._id === role._id);
    if (index >= 0) {
      roles.splice(index, 1);
    }

    setRoles([...roles])
  }

  const handleSuccessClick = async () => {
    let roleIds = [];
    roles.map((role) => roleIds.push(role._id));

    let obj = { name, username, phoneNumber, password, roles: roleIds }

    // console.log(obj);

    try {
      let res = await apis.employeeApi.addEmployee(obj);
      // console.log(res)
      Swal.fire(
        'Created!',
        `category: ${res.name} created successfully`,
        'success'
      )
      getEmployees()
      setNewEmployeeModalVisible(false)
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
    <ActionModal isVisible={newEmployeeModal} setIsVisible={() => setNewEmployeeModalVisible(false)} title="New Employee">
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">Name <span className="text-danger">*</span></span></div>
          <input name="username" placeholder="name" value={name} onChange={handleNameInput}
            type="text" className={"w-75 form-control input"} />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text h6 w-25">User name <span className="text-danger">*</span></span></div>
          <input name="username" placeholder="username" value={username} onChange={handleUserNameInput}
            type="text" className={"w-75 form-control input"} />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text h6 w-25">Phone # <span className="text-danger">*</span></span></div>
          <input name="username" placeholder="6 **** ***" value={phoneNumber} onChange={handlePhoneInput}
            type="text" className={"w-75 form-control input"} />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text h6 w-25">Password <span className="text-danger">*</span></span></div>
          <input name="username" placeholder="password" value={password} onChange={handlePasswordInput}
            type="password" className={"w-75 form-control input"} />
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text h6 w-25">Roles <span className="text-danger">*</span></span></div>
          <div className="d-flex justify-content-center align-items-center w-75">
            <Form.Group className={"w-75 m-0"}>
              <Form.Control onChange={handleRoleInput} as="select" className={"form-control input align-self-center m-0"}>
                <option>Select employees role</option>
                {listOfRoles.map((role, key) => {
                  return <option key={key}>{role.name}</option>
                })}
              </Form.Control>
            </Form.Group>
            <button onClick={() => addToRoles(role)} className="btn btn-primary text-center w-25 ml-2"><span
              className="h6">Add</span></button>
          </div>
        </div>

        <div className="row ml-1">
          <table className="table table-striped" style={{ height: '5px' }}>
            <thead className="items-table-header custom-table">
              <tr>
                <th className="text-center">Roles</th>
                <th className="text-center"></th>
              </tr>
            </thead>
            <tbody style={{ height: '10px' }}>
              {roles.map((role, key) => {
                return (
                  <tr key={key} className="custom-table">
                    <td className="text-center text">{role.name}</td>
                    <td onClick={() => deleteRole(role)} className="text-center text trash-icon">
                      <DeleteIcon style={{ fontSize: 20 }} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="d-flex justify-content-around align-items-center mt-4 mx-5">
        <button onClick={() => handleCancleClick()} className="btn btn-danger mr-2"><span className="h5 px-2">Cancel</span></button>
        <button onClick={() => handleSuccessClick()} className="btn btn-success mr-2"><span
          className="h5 px-2">Sumit</span></button>
      </div>
    </ActionModal>
  )
}

const EditEmplyee = (props) => {
  const { setEditModalVisible, editModal, user, getEmployees, listOfRoles } = props;
  const [name, setName] = useState(user.name)
  const [username, setUserName] = useState(user.username)
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber)
  const [role, setRole] = useState('')
  const [roles, setRoles] = useState([])

  useEffect(() => {
    let _roles = []
    if (user.roles) {
      user.roles.forEach((id) => {
        let _role = listOfRoles.find((role) => role._id === id);
        _roles.push(_role)
      })
    }

    setRoles(_roles);
  }, [])

  const handleNameInput = (event) => setName(event.target.value);
  const handleUserNameInput = (event) => setUserName(event.target.value);
  const handlePasswordInput = (event) => setPassword(event.target.value);
  const handlePhoneInput = (event) => setPhoneNumber(event.target.value);
  const handleRoleInput = (event) => setRole(event.target.value);

  const handleCancleClick = () => {
    setName('')
    setEditModalVisible(false)
  }

  const addToRoles = (name) => {
    let _roles = roles;
    let newRole = listOfRoles.find((role) => role.name === name);

    _roles.push(newRole);

    setRoles([..._roles]);
  }

  const deleteRole = (role) => {
    let index = roles.findIndex((r) => r._id === role._id);
    if (index >= 0) {
      roles.splice(index, 1);
    }

    setRoles([...roles])
  }

  const handleSuccessClick = async () => {
    let roleIds = [];
    roles.map((role) => roleIds.push(role._id));

    let obj = { name, username, phoneNumber, password, roles: roleIds }

    // console.log(obj);

    try {
      let res = await apis.employeeApi.editEmployee(user._id, obj);
      Swal.fire(
        'Updated!',
        `category: ${res.name} updated successfully`,
        'success'
      )
      getEmployees()
      setEditModalVisible(false)
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
    <ActionModal isVisible={editModal} setIsVisible={() => setEditModalVisible(false)} title="Edit employee information">
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="w-25 text h6">Name <span className="text-danger">*</span></span></div>
          <input name="username" placeholder="name" value={name} onChange={handleNameInput}
            type="text" className={"w-75 form-control input"} />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text h6 w-25">User name <span className="text-danger">*</span></span></div>
          <input name="username" placeholder="username" value={username} onChange={handleUserNameInput}
            type="text" className={"w-75 form-control input"} />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text h6 w-25">Phone # <span className="text-danger">*</span></span></div>
          <input name="username" placeholder="6 **** ***" value={phoneNumber} onChange={handlePhoneInput}
            type="text" className={"w-75 form-control input"} />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text h6 w-25">Password <span className="text-danger">*</span></span></div>
          <input name="username" placeholder="password" value={password} onChange={handlePasswordInput}
            type="password" className={"w-75 form-control input"} />
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text h6 w-25">Roles <span className="text-danger">*</span></span></div>
          <div className="d-flex justify-content-center align-items-center w-75">
            <Form.Group className={"w-75 m-0"}>
              <Form.Control onChange={handleRoleInput} as="select" className={"form-control input align-self-center m-0"}>
                <option>Select employees role</option>
                {listOfRoles.map((role, key) => {
                  return <option key={key}>{role.name}</option>
                })}
              </Form.Control>
            </Form.Group>
            <button onClick={() => addToRoles(role)} className="btn btn-primary text-center w-25 ml-2"><span
              className="h6">Add</span></button>
          </div>
        </div>

        <div className="row ml-1">
          <table className="table table-striped" style={{ height: '5px' }}>
            <thead className="items-table-header custom-table">
              <tr>
                <th className="text-center">Roles</th>
                <th className="text-center"></th>
              </tr>
            </thead>
            <tbody style={{ height: '10px' }}>
              {roles.map((role, key) => {
                return (
                  <tr key={key} className="custom-table">
                    <td className="text-center text">{role.name}</td>
                    <td onClick={() => deleteRole(role)} className="text-center text trash-icon">
                      <DeleteIcon style={{ fontSize: 20 }} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="d-flex justify-content-around align-items-center mt-4 mx-5">
        <button onClick={() => handleCancleClick()} className="btn btn-danger mr-2"><span className="h5 px-2">Cancel</span></button>
        <button onClick={() => handleSuccessClick()} className="btn btn-success mr-2"><span
          className="h5 px-2">Sumit</span></button>
      </div>
    </ActionModal>
  )
}

const mapStateToProps = ({ employee, role }) => {
  return {
    employees: employee.employees,
    roles: role.roles
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ setEmployees }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Employees);
