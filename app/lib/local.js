const fs = require('fs').promises;
const path = require('path');

module.exports = class LocalService {
  constructor(dir) {
    this.dir = dir;
  }
  resolvePath(p) {
    return path.join(this.dir, p.real || p);
  }
  async walk(root) {
    const dirs = [root];
    const resp = [];

    let folder;
    while (folder = dirs.shift()) {
      try {
        const files = await fs.readdir(folder, {
          withFileTypes: true
        });
        files.forEach(file => {
          (file.isDirectory() ? dirs : resp).push(path.join(folder, file.name));
        });
      } catch (e) {}
    }

    return resp;
  }
  async list({ meta }) {
    const resp = await this.walk(this.dir);

    const ret = resp.map(p => {
      const realPath = path.relative(this.dir, p);
      return {
        real: realPath,
        posix: realPath.split(path.sep).join('/')
      };
    });

    if (meta) {
      for (let i = 0; i < ret.length; i += 1) {
        ret[i].meta = await this.head(ret[i]);
      }
    }
    return ret;
  }
  async head(p) {
    const stat = await fs.stat(this.resolvePath(p));
    return {
      size: stat.size,
      modified: Math.round(stat.mtimeMs / 1000),
    };
  }
  async write(p, data, modified) {
    const filePath = this.resolvePath(p);
    await fs.writeFile(filePath, data, {
      encoding: null,
      flag: 'w'
    });
    if (modified) {
      await fs.utimes(filePath, Math.round(Date.now() / 1000), modified);
    }
  }
  read(p) {
    return fs.readFile(this.resolvePath(p), {
      encoding: null,
      flag: 'r'
    });
  }
}
