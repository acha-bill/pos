import React, { Component } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import './reports.css';
import {
  Dashboard,
  InventoryReport,
  Sales,
  Customer,
  PrintReport,
  PhotocopyReport,
  SpiralReport,
  ScanReport,
  StockMovement
} from '../../sections';
import SaleDetailsReport from '../../sections/saledetails/saledetails';


const routes = [
  { id: 1, name: 'Dashboard' },
  { id: 2, name: 'Sales' },
  { id: 3, name: 'Sales Details' },
  { id: 4, name: 'Inventory' },
  { id: 5, name: 'Stock Mvts' },
  { id: 6, name: 'Customer' },
  { id: 7, name: 'Print' },
  { id: 8, name: 'Photocopy' },
  { id: 9, name: 'Spiral' },
  { id: 10, name: 'Scan' },
  { id: 10, name: 'Payment' },
];

class Reports extends Component {
  constructor() {
    super();
    this.state = {
      active: 1,
    }
  }

  renderRoutes() {
    const { active } = this.state;

    switch (active) {
      case 1:
        return <Dashboard />;
      case 2:
        return <Sales />
      case 3:
        return < SaleDetailsReport />
      case 4:
        return <InventoryReport />
      case 5:
        return <StockMovement />
      case 6:
        return <Customer />;
      case 7:
        return <PrintReport />;
      case 8:
        return <PhotocopyReport />;
      case 9:
        return <SpiralReport />;
      case 10:
        return <ScanReport />;
      default:
        return <Dashboard />;
    }
  }

  render() {
    const { active } = this.state;

    return (
      <div>
        <div className="my-container-xsm">
          <nav className="navbar navbar-expand-lg navbar-light py-3 mt-2 report-nav">
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav mx-auto h5 f-1">
                {routes.map((route, key) => {
                  return (
                    <li key={key} onClick={() => this.setState({ active: route.id })} className={"nav-item"}>
                      <a className="nav-link" href="###">
                        <span className={active === route.id ? "report-active-link" : null}>{route.name}</span>
                        {active === route.id ? <span class="sr-only">(current)</span> : null}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
          <div className="my-container-xsm">
            {this.renderRoutes()}
          </div>
        </div>
      </div>
    )
  };
};

export default Reports;
