const { sizeString } = require('./utils');
const S3Service = require('./s3');
const LocalService = require('./local');

function resolveConflict(localFiles, remoteFiles) {
  localFiles.forEach(p => {
    const matched = remoteFiles.find(r => r.posix === p.posix);
    if (matched) {
      p.ref = matched;
      matched.ref = p;
    }
  });

  const conflict = localFiles.filter(p => p.ref);

  for (let i = 0; i < conflict.length; i += 1) {
    const localFile = conflict[i];
    const remoteRef = localFile.ref;

    if (remoteRef.meta.modified === localFile.meta.modified && remoteRef.meta.size === localFile.meta.size) {
      localFile.action = "==";
    } else {
      localFile.action = remoteRef.meta.modified >= localFile.meta.modified ? '<<' : '>>';
    }
  }
}

function printAction(file, symbol, local, remote) {
  console.log(`  ${local.padEnd(6)}    ${symbol}    ${remote.padEnd(6)}    ${file}`);
}

async function runAction(action, local, remote, localFile, remoteFile) {
  let data;
  switch (action) {
    case '>>':
      data = await local.read(localFile);
      await remote.write(localFile.posix, data, localFile.meta.modified)
      break;
    case '<<':
      data = await remote.read(remoteFile);
      await local.write(remoteFile.posix, data, remoteFile.meta.modified)
      break;
  }
}

async function syncFolderPair(s3Config, syncConfig) {
  const remote = new S3Service(s3Config, syncConfig.remote);
  const local = new LocalService(syncConfig.local);

  const remoteFiles = await remote.list({ meta: true });
  const localFiles = await local.list({ meta: true });

  resolveConflict(localFiles, remoteFiles);
  printAction('File', '  ', 'Local', 'Remote');

  for (let i = 0; i < localFiles.length; i += 1) {
    const localFile = localFiles[i];
    if (!localFile.ref || localFile.action === '>>') {
      printAction(localFile.posix, '>>', sizeString(localFile.meta.size), localFile.ref ? sizeString(localFile.ref.meta.size) : 'N/A');
      await runAction('>>', local, remote, localFile, localFile.ref);
    } else if (localFile.action === '==') {
      printAction(localFile.posix, '==', sizeString(localFile.meta.size), sizeString(localFile.ref.meta.size));
    }
  }

  for (let i = 0; i < remoteFiles.length; i += 1) {
    const remoteFile = remoteFiles[i];
    if (remoteFile.ref) {
      continue;
    }
    printAction(remoteFile.posix, '<<', 'N/A', sizeString(remoteFile.meta.size));
    await runAction('<<', local, remote, remoteFile.ref, remoteFile);
  }
}

module.exports.syncFolderPair = syncFolderPair;