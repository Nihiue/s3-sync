const AWS = require('aws-sdk');
const path = require('path').posix;

module.exports = class S3Service {
  constructor(cfg, remote) {
    const opt = {
      accessKeyId: cfg.ak,
      secretAccessKey: cfg.sk,
      region: cfg.region,
      apiVersion: '2006-03-01'
    };

    if (cfg.endpoint) {
      opt.endpoint = cfg.endpoint;
    }

    if (cfg.minioCompatibility) {
      opt.signatureVersion = 'v4';
      opt.s3ForcePathStyle = true;
    }

    this.client = new AWS.S3(opt);
    this.bucket = cfg.bucket;
    this.remotePath = remote;
  }
  resolvePath(p) {
    return path.join(this.remotePath, p.real || p);
  }
  async list({ meta }) {
    try {
      const resp = await this.client.listObjectsV2({
        Bucket: this.bucket,
        Prefix: this.remotePath + (this.remotePath.endsWith('/') ? '' : '/'),
      }).promise();

      const ret = resp.Contents.map(obj => {
        const realPath = path.relative(this.remotePath, obj.Key);
        return {
          real: realPath,
          posix: realPath
        };
      });
      if (meta) {
        for (let i = 0; i < ret.length; i += 1) {
          ret[i].meta = await this.head(ret[i]);
        }
      }
      return ret;
    } catch (e) {
      console.log(e);
    }
  }
  async head(p) {
    const ret = await this.client.headObject({
      Bucket: this.bucket,
      Key: this.resolvePath(p)
    }).promise();
    return {
      size: ret.ContentLength,
      // real file modify time
      modified: ret.Metadata && ret.Metadata.modified ? parseInt(ret.Metadata.modified, 10) : Math.round(ret.LastModified.valueOf() / 1000),
    };
  }
  write(p, data, modified) {
    const metadata = {};
    if (modified) {
      metadata.modified = modified.toString();
    }
    return this.client.putObject({
      Bucket: this.bucket,
      Key: this.resolvePath(p),
      Body: data,
      Metadata: metadata
    }).promise();
  }
  async read(p) {
    const resp = await this.client.getObject({
      Bucket: this.bucket,
      Key: this.resolvePath(p)
    }).promise();
    return resp.Body;
  }
}
