const baseUrl = '/category'
export default class CategoryApi {
  constructor(api) {
    this.api = api
  }
  async categories() {
    try {
      let res = await this.api.get(`${baseUrl}/`)
      return res.data
    } catch (e) {
      throw e
    }
  }
  async addCategory(obj) {
    try {
      let res = await this.api.post(`${baseUrl}/`, obj)
      return res.data
    } catch (e) {
      throw e
    }
  }
  async deleteCategory(id) {
    try {
      let res = await this.api.delete(`${baseUrl}/${id}`)
      return res.data
    } catch (e) {
      throw e
    }
  }
  async getCategoryByName(name) {
    try {
      let res = await this.api.get(`${baseUrl}/name/${name}`)
      return res.data
    } catch (e) {
      throw e
    }
  }
  async editCategory(id, obj) {
    try {
      let res = await this.api.put(`${baseUrl}/${id}`, obj)
      return res.data
    } catch (e) {
      throw e
    }
  }
}