const baseUrl = "/item";
export default class ItemApi {
  constructor(api) {
    this.api = api;
  }

  async items() {
    try {
      let res = await this.api.get(`${baseUrl}/`);
      return res.data;
    } catch (e) {
      throw e;
    }
  }

  async addItem(obj) {
    try {
      let res = await this.api.post(`${baseUrl}/`, obj);
      return res.data;
    } catch (e) {
      throw e;
    }
  }

  async editItem(id, obj) {
    try {
      let res = await this.api.put(`${baseUrl}/${id}`, obj);
      return res.data;
    } catch (e) {
      throw e;
    }
  }

  async deleteItem(id) {
    try {
      let res = await this.api.delete(`${baseUrl}/${id}`);
      return res.data;
    } catch (e) {
      throw e;
    }
  }

  async moveStock(id, obj) {
    try {
      let res = await this.api.post(`${baseUrl}/${id}/movestock`, obj);
      return res.data;
    } catch (e) {
      throw e;
    }
  }
}
