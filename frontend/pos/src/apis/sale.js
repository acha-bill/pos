const baseUrl = '/sale'
export default class SaleApi {
  constructor(api) {
    this.api = api
  }
  async sales(startDate = "", endDate = "") {
    try {
      let res = await this.api.get(`${baseUrl}/?startDate=${startDate}&endDate=${endDate}`)
      return res.data
    } catch (e) {
      throw e
    }
  }
  async addSale(obj) {
    try {
      let res = await this.api.post(`${baseUrl}/`, obj)
      return res.data
    } catch (e) {
      throw e
    }
  }

  async editSale(id, obj) {
    try {
      let res = await this.api.put(`${baseUrl}/${id}`, obj)
      return res.data
    } catch (e) {
      throw e
    }
  }

  async getCustomerSales(id) {
    try {
      let res = await this.api.get(`${baseUrl}/customer/${id}`)
      return res.data
    } catch (e) {
      throw e
    }
  }
}