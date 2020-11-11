import React, { Component } from 'react';
import ManagePrinters from './manageprinters';

const routes = [
    { id: 1, name: "Printers" },
];

class Print extends Component {
    constructor() {
        super()
        this.state = {
            active: 1
        }
    }
    renderRoutes = () => {
        switch (this.state.active) {
            case 1:
                return <ManagePrinters />
            default:
                return <ManagePrinters />;
        }
    }
    setActive = (active) => {
        this.setState({ active })
    }
    render() {
        let { active } = this.state
        return (
            <div>
                <div className="container">
                    <nav className="navbar navbar-expand-lg navbar-light py-3 mt-2 report-nav settings__tab">
                        <div className="collapse navbar-collapse">
                            <ul className="navbar-nav mx-auto h5 f-1 settingTab__list ">
                                {routes.map((route, key) => {
                                    return (
                                        <li
                                            key={key}
                                            onClick={() => this.setActive(route.id)}
                                            className={"nav-item"}
                                        >
                                            <a className="nav-link" href="###">
                                                <span
                                                    className={
                                                        active === route.id ? "report-active-link" : null
                                                    }
                                                >
                                                    {route.name}
                                                </span>
                                                {active === route.id ? (
                                                    <span class="sr-only">(current)</span>
                                                ) : null}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </nav>
                    <div className="container">{this.renderRoutes()}</div>
                </div>
            </div>
        );
    }
}

export default Print