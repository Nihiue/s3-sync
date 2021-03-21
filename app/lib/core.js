const { sizeString, formatDate } = require('./utils');
const S3Service = require('./s3');
const LocalService = require('./local');

function print(action, localFile, remoteFile) {
  const line = [];
  if (localFile) {
    // line.push(formatDate(localFile.meta.modified * 1000));
    line.push(sizeString(localFile.meta.size).padEnd(4));
  } else {
    // line.push('NA'.padEnd(11));
    line.push('N/A'.padEnd(4));
  }
  line.push(action);

  if (remoteFile) {
    // line.push(formatDate(remoteFile.meta.modified * 1000));
    line.push(sizeString(remoteFile.meta.size).padStart(4));
  } else {
    // line.push('NA'.padStart(11));
    line.push('N/A'.padStart(4));
  }
  line.push((localFile || remoteFile).posix);
  console.log(`  ${line.join('  ')}`);
}

async function runAction(action, local, remote, localFile, remoteFile) {
  let data;

  print(action, localFile, remoteFile);

  switch (action) {
    case '>>':
      data = await local.read(localFile);
      await remote.write(localFile.posix, data, localFile.meta.modified)
      break;
    case '<<':
      data = await remote.read(remoteFile);
      await local.write(remoteFile.posix, data, remoteFile.meta.modified)
      break;
    case '==':
      break;
  }
}

async function syncFolderPair(s3Config, syncConfig) {
  const remote = new S3Service(s3Config, syncConfig.remote);
  const local = new LocalService(syncConfig.local);

  const remoteFiles = await remote.list({ meta: true });
  const localFiles = await local.list({ meta: true });

  localFiles.forEach(localFile => {
    const remoteFile = remoteFiles.find(r => r.posix === localFile.posix);
    if (remoteFile) {
      localFile.ref = remoteFile;
      remoteFile.ref = localFile;

      if (remoteFile.meta.modified === localFile.meta.modified && remoteFile.meta.size === localFile.meta.size) {
        localFile.action = "==";
      } else {
        localFile.action = remoteFile.meta.modified >= localFile.meta.modified ? '<<' : '>>';
      }
    } else {
      localFile.action = '>>';
    }
  });

  for (let i = 0; i < localFiles.length; i += 1) {
    const localFile = localFiles[i];
    await runAction(localFile.action, local, remote, localFile, localFile.ref);
  }

  for (let i = 0; i < remoteFiles.length; i += 1) {
    const remoteFile = remoteFiles[i];
    if (!remoteFile.ref) {
      await runAction('<<', local, remote, null, remoteFile);
    }
  }
}

module.exports.syncFolderPair = syncFolderPair;