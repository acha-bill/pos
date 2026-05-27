import React, { Suspense, useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import apis from '../src/apis/apis'
import Alert from 'react-bootstrap/Alert'
import { connect } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from 'react-router-dom'
import { bindActionCreators } from 'redux';
import { setToken, setUser } from './redux/actions/authActions';

const Categories = React.lazy(() => import("./pages/categories/categories"));
const Customers = React.lazy(() => import("./pages/customers/customers"));
const Employees = React.lazy(() => import("./pages/employees/employees"));
const Items = React.lazy(() => import("./pages/items/items"));
const Login = React.lazy(() => import("./pages/login/login"));
const Print = React.lazy(() => import("./pages/print/print"));
const Reports = React.lazy(() => import("./pages/reports/reports"));
const Sales = React.lazy(() => import("./pages/sales/sales"));
const Settings = React.lazy(() => import("./pages/settings/settings"));

const LoadingPage = () => (
    <div className="main-container d-flex justify-content-center align-items-center">
        <span>Loading...</span>
    </div>
);

const App = (props) => {
    const { token, items, user, history, setToken, setUser } = props;
    const [showAlert, setShowAlert] = useState(false)
    const [showAgain, setShowAgain] = useState(true)

    const checkLow = useCallback(() => {
        const hasLowStock = items.some(item => !item.isSystem && (item.qty <= item.minStock && !item.isRetired));
        setShowAlert(hasLowStock);
    }, [items]);

    useEffect(() => {
        checkLow();
        const timer = setInterval(checkLow, 900000); //15 mins
        return () => clearInterval(timer);
    }, [checkLow])

    useEffect(() => {
        let token = sessionStorage.getItem('TOKEN');
        let user = sessionStorage.getItem('USER');

        let _user = JSON.parse(user);
        if (token && token.length > 0 && user) {
            apis.initialize(token)
            setToken(token);
            setUser(_user);
        }
    }, [history, setToken, setUser])

    const NotFound = () => {

        return (
            <div>
                {token.length === 0 ?
                    <div className="main-container d-flex justify-content-center align-items-center flex-column">
                        <h1>Log in to continue</h1>
                        <h5>Not verified</h5>
                        <button className="btn btn-primary" ><a href="/login" style={{ color: 'white' }}>go to login</a></button>
                    </div>
                    :
                    <div className="main-container d-flex justify-content-center align-items-center flex-column">
                        <h1 style={{ fontSize: '5rem' }}>404</h1>
                        <h1>page not found</h1>
                        <h5>wrong route</h5>
                    </div>
                }
            </div>
        )
    }

    return (
        <div className="app">
            <Router>
                <Suspense fallback={<LoadingPage />}>
                    {
                        token.length === 0 ?

                            <Switch>
                                <Route path="/" component={Login} exact={true} />
                                <Route path="/login" component={Login} />
                                <Route component={NotFound} />
                            </Switch>
                            :
                            <>
                                <Navbar />

                                {
                                    showAlert && showAgain &&
                                    <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible>
                                        <Alert.Heading>Oh snap! You have a few low stock items!</Alert.Heading>
                                        <p>
                                            We have noticed there are a few items which are low in stock.
                                            We suggest you check them out now before they completely run out.
                                            </p>
                                        <hr />
                                        <div className="d-flex justify-content-end">
                                            <button onClick={() => setShowAgain(false)} type="button" className="btn btn-outline-danger">
                                                Don't Show again
                                                </button>

                                            <button onClick={() => setShowAlert(false)} type="button" className="btn btn-outline-danger">
                                                Dismiss
                                                </button>

                                            <button onClick={() => setShowAlert(false)} type="button" className="btn btn-outline-primary">
                                                <Link to={{ pathname: "/items", state: { showLowStock: true } }}>
                                                    <span className="ml-3">Check Items</span>
                                                </Link>
                                            </button>
                                        </div>
                                    </Alert>
                                }
                                <Switch>
                                    <Route path="/" component={Sales} exact={true} />
                                    {
                                        user.roles && user.roles.map((role) => {
                                            switch (role.name) {
                                                case "Administrator":
                                                    return (
                                                        role.name === "Administrator" ? (
                                                            <Switch>
                                                                <Route path="/items" component={Items} />
                                                                <Route path="/sales" component={Sales} />
                                                                <Route path="/customers" component={Customers} />
                                                                <Route path="/categories" component={Categories} />
                                                                <Route path="/employees" component={Employees} />
                                                                <Route path="/reports" component={Reports} />
                                                                <Route path="/settings" component={Settings} />
                                                                <Route path="/print" component={Print} />
                                                            </Switch>
                                                        ) : (
                                                                <Route component={Login} />
                                                            )
                                                    )
                                                case "Items":
                                                    return (
                                                        role.name === "Items" ? (
                                                            <Switch>
                                                                <Route path="/items" component={Items} />
                                                                <Route path="/print" component={Print} />
                                                            </Switch>
                                                        ) : (
                                                                <Route path="/login" component={Login} />
                                                            )
                                                    )
                                                case "Sales":
                                                    return (
                                                        role.name === "Sales" ? (
                                                            <Route path="/sales" component={Sales} />
                                                        ) : (
                                                                <Route path="/login" component={Login} />
                                                            )
                                                    )
                                                case "Employees":
                                                    return (
                                                        role.name === "Employees" ? (
                                                            <Route path="/employees" component={Employees} />
                                                        ) : (
                                                                <Route path="/login" component={Login} />
                                                            )
                                                    )
                                                case "Categories":
                                                    return (
                                                        role.name === "Categories" ? (
                                                            <Route path="/categories" component={Categories} />
                                                        ) : (
                                                                <Route path="/login" component={Login} />
                                                            )
                                                    )
                                                case "Customers":
                                                    return (
                                                        role.name === "Customers" ? (
                                                            <Route path="/customers" component={Customers} />
                                                        ) : (
                                                                <Route path="/login" component={Login} />
                                                            )
                                                    )
                                                case "Settings":
                                                    return (
                                                        role.name === "Settings" ? (
                                                            <Route path="/settings" component={Settings} />
                                                        ) : (
                                                                <Route path="/login" component={Login} />
                                                            )
                                                    )

                                                default:
                                                    return (<Route path="/login" component={Login} />);
                                            }
                                        })
                                    }

                                    <Route component={NotFound} />
                                </Switch>
                            </>
                    }
                </Suspense>
            </Router>
        </div>
    );
}

const mapStatesToProps = ({ auth, role, item }) => {
    return {
        token: auth.token,
        user: auth.user,
        items: item.items
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ setToken, setUser }, dispatch);
};

export default connect(mapStatesToProps, mapDispatchToProps)(App);
