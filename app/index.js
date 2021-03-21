const s3Service = require('./lib/s3');
const localService = require('./lib/local');
const yargs = require('yargs/yargs');

const path = require('path');
const fs = require('fs');

function readConfig(cfgPath) {
  try {
    const content = fs.readFileSync(path.join(__dirname, cfgPath));
    const cfg = JSON.parse(content);
    if (!cfg.s3 || !cfg.local || !cfg.remote) {
      throw new Error('not valid config file');
    }
    return cfg;
  } catch (e) {
    console.log(e.toString());
    return null;
  }

}

async function main() {
  const argv = yargs(process.argv.slice(2))
    .default('config', 'config.json')
    .argv;

  const config = readConfig(argv.config);
  if (!config) {
    return;
  }

  const s3 = new s3Service(config.s3, config.remote);
  const local = new localService(config.local);

}

main();