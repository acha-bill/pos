const baseUrl = "/printer";
export default class PrinterApi {
    constructor(api) {
        this.api = api;
    }

    async printers() {
        try {
            let res = await this.api.get(`${baseUrl}/`);
            return res.data;
        } catch (e) {
            throw e;
        }
    }

    async addPrinter(obj) {
        try {
            let res = await this.api.post(`${baseUrl}/`, obj);
            return res.data;
        } catch (e) {
            throw e;
        }
    }

    async editPRinter(id, obj) {
        try {
            let res = await this.api.put(`${baseUrl}/${id}`, obj);
            return res.data;
        } catch (e) {
            throw e;
        }
    }

    async deletePrinter(id) {
        try {
            let res = await this.api.delete(`${baseUrl}/${id}`);
            return res.data;
        } catch (e) {
            throw e;
        }
    }


    async addRefill(id, obj) {
        try {
            let res = await this.api.post(`${baseUrl}/${id}/refill`, obj);
            return res.data;
        } catch (e) {
            throw e;
        }
    }

    async addToner(id, obj) {
        try {
            let res = await this.api.post(`${baseUrl}/${id}/toner`, obj);
            return res.data;
        } catch (e) {
            throw e;
        }
    }

}
