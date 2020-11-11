import React, { useState, useRef, useEffect } from "react";
import { NavLink, Route } from "react-router-dom";
import LibraryBooksIcon from "@material-ui/icons/LibraryBooks";
import ShoppingCartIcon from "@material-ui/icons/ShoppingCart";
import PeopleAltIcon from "@material-ui/icons/PeopleAlt";
import ShowChartIcon from "@material-ui/icons/ShowChart";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import SettingsIcon from "@material-ui/icons/Settings";
import CategoryIcon from '@material-ui/icons/Category';
import AccountCircle from '@material-ui/icons/AccountCircle';
import Popover from 'react-popover';
import { connect } from "react-redux";
import { setUser, setToken } from '../../redux/actions/authActions';
import { bindActionCreators } from 'redux';
import EditProfileModal from '../editProfileModal/editProfileModal';
import EditIcon from '@material-ui/icons/Edit';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import "./Navbar.css";
import { useHistory } from 'react-router-dom';
import Print from "@material-ui/icons/Print";


function Nav(props) {
    const { user } = props;
    const [editModal, setEditModal] = useState(false);
    const [show, setShow] = useState(false);
    const target = useRef(null);
    const history = useHistory();

    useEffect(() => {
    }, [props])

    const logOut = () => {
        sessionStorage.clear('TOKEN');
        sessionStorage.clear('USER');
        history.push("/login")
        props.setUser({});
        props.setToken('')
    };

    function renderNav(userRole, key) {
        switch (userRole) {
            case "Administrator":
                return (
                    <div className="nav__container " key={key}>
                        <NavLink className="nav__item" to="/sales" activeClassName="is-active">
                            <ShoppingCartIcon />
                            <p className="nav__text">Sales</p>
                        </NavLink>
                        <NavLink className="nav__item" to="/items" activeClassName="is-active">
                            <LibraryBooksIcon />
                            <p className="nav__text">Items</p>
                        </NavLink>
                        <NavLink className="nav__item" to="/print" activeClassName="is-active">
                            <Print />
                            <p className="nav__text">Printers</p>
                        </NavLink>
                        <NavLink className="nav__item" to="/categories" activeClassName="is-active">
                            <CategoryIcon />
                            <p className="nav__text">Categories</p>
                        </NavLink>
                        <NavLink
                            className="nav__item"
                            to="/customers"
                            activeClassName="is-active"
                        >
                            <PeopleAltIcon />
                            <p className="nav__text">Customers</p>
                        </NavLink>
                        <NavLink className="nav__item" to="/reports" activeClassName="is-active">
                            <ShowChartIcon />
                            <p className="nav__text">Reports</p>
                        </NavLink>
                        <NavLink
                            className="nav__item"
                            to="/employees"
                            activeClassName="is-active"
                        >
                            <GroupAddIcon />
                            <p className="nav__text">Employees</p>
                        </NavLink>
                        <NavLink className="nav__item" to="/settings" activeClassName="is-active">
                            <SettingsIcon />
                            <p className="nav__text">Settings</p>
                        </NavLink>

                    </div>
                )
            case "Items":
                return (
                    <div className="nav__" key={key}>
                        <NavLink className="nav__item" to="/items" activeClassName="is-active">
                            <LibraryBooksIcon />
                            <p className="nav__text">Items</p>
                        </NavLink>
                        <NavLink className="nav__item" to="/print" activeClassName="is-active">
                            <Print />
                            <p className="nav__text">Printers</p>
                        </NavLink>

                    </div>
                )
            case "Sales":
                return (
                    <div className="nav__" key={key}>
                        <NavLink className="nav__item" to="/sales" activeClassName="is-active">
                            <ShoppingCartIcon />
                            <p className="nav__text">Sales</p>
                        </NavLink>

                    </div>

                );
            case "Customers":
                return (
                    <div className="nav__" key={key}>
                        <NavLink
                            className="nav__item"
                            to="/customers"
                            activeClassName="is-active"
                        >
                            <PeopleAltIcon />
                            <p className="nav__text">Customers</p>
                        </NavLink>

                    </div>

                );
            case "Reports":
                return (
                    <div className="nav__" key={key}>
                        <NavLink className="nav__item" to="/reports" activeClassName="is-active">
                            <ShowChartIcon />
                            <p className="nav__text">Reports</p>
                        </NavLink>

                    </div>

                );
            case "Employees":
                return (
                    <div className="nav__" key={key}>
                        <NavLink
                            className="nav__item"
                            to="/employees"
                            activeClassName="is-active"
                        >
                            <GroupAddIcon />
                            <p className="nav__text">Employees</p>
                        </NavLink>

                    </div>

                );
            case "Settings":
                return (
                    <div className="nav__" key={key}>
                        <NavLink className="nav__item" to="/settings" activeClassName="is-active">
                            <SettingsIcon />
                            <p className="nav__text">Settings</p>
                        </NavLink>
                    </div>

                );
            default:
                break;
        }
    }

    const popoverProps = {
        isOpen: show,
        preferPlace: "below",
        place: "below",
        body: [
            <OverlayComponent
                setShow={() => setShow(false)}
                setEditModal={() => setEditModal(true)}
                user={user}
                logOut={() => logOut()}
            />
        ],
    }

    return (
        <nav className="nav__container">
            <div className="nav__list">
                {user.roles &&
                    user.roles.map((role, key) => {
                        return (
                            renderNav(role.name, key)
                        )
                    })
                }
            </div>
            <div className="">
                <Popover {...popoverProps} style={{ width: '20%' }}>
                    <div onClick={() => setShow(!show)} className="nav__item mx-1 px-4 x" >
                        <AccountCircle />
                        <p className="nav__text">Profile</p>
                    </div>
                </Popover>
                <EditProfileModal
                    editModal={editModal}
                    setEditModal={() => setEditModal(false)}
                />
            </div>
        </nav>
    );
}

const mapStatesToProps = ({ auth, role }) => {
    return {
        user: auth.user,
        role: role.roles
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ setUser, setToken }, dispatch);
};

export default connect(mapStatesToProps, mapDispatchToProps)(Nav);

const OverlayComponent = (props) => {
    const { setShow, setEditModal, user, logOut } = props;

    useEffect(() => {
    }, [user])

    return (
        <div className="bg-white pb-2 mt-1" style={{ border: 'solid 1px #ccc', borderRadius: '5px' }}>
            <div className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: 'solid 1px #cccccc8a' }}>
                <div className="px-3">Profile information</div>
                <div onClick={() => setShow(false)} className="x px-3 font-weight-bold h5">x</div>
            </div>
            <div className="">
                <div className="my-3 px-3">
                    <h3 className="card-title m-0" >{user.name}</h3>
                    <p className="card-text m-0">( {user.username} )</p>
                </div>
                <div className="my-2 px-3">
                    <h6 className="m-0 font-weight-bolder">Role(s)</h6>

                    {user.length > 0 && user.roles.map((role) => {
                        return (
                            <span key={role._id} className="card-text m-0">
                                {role.name}, &nbsp;
                            </span>
                        );
                    })}
                </div>
                <div className="my-2 px-3 d-flex justify-content-between align-items-center">
                    <h6 className="m-0 font-weight-bolder" style={{ flex: 1 }}>PhoneNumber:</h6>
                    <p className="card-text m-0" style={{ flex: 2.5 }}>{user.phoneNumber}</p>
                </div>
                <div className="mt-4 mb-2" style={{ borderBottom: 'solid 1px #cccccc8a' }}></div>
                <div className="d-flex px-3 justify-content-center align-items-center">
                    <button onClick={() => logOut()} className="btn btn-danger mr-3"><span className="mr-2"><ExitToAppIcon style={{ fontSize: 20 }} /></span>Log out</button>
                    <button onClick={() => setEditModal()} className="btn btn-success"><span className="mr-2"><EditIcon style={{ fontSize: 20 }} /></span>Edit</button>
                </div>
            </div>
        </div>
    )
}

