const fs = require('fs');
module.exports = class LocalService {
  constructor(dir) {
    this.dir = dir;
  }
  async list() { }
  async head() { }
  async upload() { }
  async download() { }
}
