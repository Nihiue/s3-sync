const AWS = require('aws-sdk');

module.exports = class S3Service {
  constructor(cfg, remote) {
    const opt = {
      accessKeyId: cfg.ak,
      secretAccessKey: cfg.sk,
      region: cfg.region
    };

    if (cfg.endpoint) {
      opt.endpoint = cfg.endpoint;
    }

    if (cfg.minioCompatibility) {
      opt.signatureVersion = 'v4';
      opt.s3ForcePathStyle = true;
    }

    this.client = new AWS.S3(cfg);
    this.bucket = cfg.bucket;
    this.remotePath = remote;
  }

  getClient() {
    return this.client;
  }

  async list() { }
  async head() { }
  async upload() { }
  async download() { }
}
