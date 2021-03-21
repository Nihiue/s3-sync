
const yargs = require('yargs/yargs');
const { syncFolderPair} = require('./lib/core.js');
const path = require('path');
const fs = require('fs');

function readConfig(cfgPath) {
  try {
    const content = fs.readFileSync(path.join(__dirname, cfgPath));
    const cfg = JSON.parse(content);
    if (!cfg.s3 || !cfg.folderPairs) {
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
  for (let i = 0; i < config.folderPairs.length; i += 1) {
    console.log(`Sync [${config.folderPairs[i].name}]`);
    await syncFolderPair(config.s3, config.folderPairs[i]);
    console.log('Done \n');
  }
  setTimeout(() => {}, 3000);
}

main();