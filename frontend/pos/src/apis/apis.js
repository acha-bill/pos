import AuthApi from "./auth";
import { getApi } from "./axios";
import CategoryApi from "./category";
import RoleApi from "./role";
import ItemApi from "./item";
import EmployeeApi from './employee';
import CustomerApi from './customer';
import SaleApi from './sale';
import ReportApi from "./report";
import BackupApi from "./backup";
import PrinterApi from "./printer";

class Apis {
    initialize(token) {
        this.token = token
        this.api = getApi(this.token)

        this.authApi = new AuthApi(this.api)
        this.categoryApi = new CategoryApi(this.api)
        this.roleApi = new RoleApi(this.api)
        this.employeeApi = new EmployeeApi(this.api)
        this.itemApi = new ItemApi(this.api);
        this.customerApi = new CustomerApi(this.api);
        this.saleApi = new SaleApi(this.api);
        this.reportApi = new ReportApi(this.api)
        this.backupApi = new BackupApi(this.api)
        this.printerApi = new PrinterApi(this.api)

    }
}

let apis = new Apis();
export default apis;
