const baseUrl = "/user";
export default class EmployeeApi {
  constructor(api) {
    this.api = api;
  }
  async employees() {
    try {
      let res = await this.api.get(`${baseUrl}/`);
      return res.data;
    } catch (e) {
      throw e;
    }
  }
  async addEmployee(obj) {
    try {
      let res = await this.api.post(`${baseUrl}/`, obj);
      return res.data;
    } catch (e) {
      throw e;
    }
  }
  async deleteEmployee(id) {
    try {
      let res = await this.api.delete(`${baseUrl}/${id}`);
      return res.data;
    } catch (e) {
      throw e;
    }
  }
  async editEmployee(id, obj) {
    try {
      let res = await this.api.put(`${baseUrl}/${id}`, obj);
      return res.data;
    } catch (e) {
      throw e;
    }
  }

  async getEmployeeRoles(id) {
    try {
      let res = await this.api.put(`${baseUrl}/${id}/roles`);
      return res.data;
    } catch (e) {
      throw e;
    }
  }

  async getEmployee(id) {
    try {
      let res = await this.api.get(`${baseUrl}/${id}`);
      return res.data;
    } catch (e) {
      throw e;
    }
  }

  async getProfile() {
    try {
      let res = await this.api.get(`${baseUrl}/profile/me`);
      return res.data;
    } catch (e) {
      throw e;
    }
  }
}
