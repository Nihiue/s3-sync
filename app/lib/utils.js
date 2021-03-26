const dayjs = require('dayjs');

module.exports = {
  sizeString(size) {
    if (typeof size !== 'number') {
      return ' ';
    }
    const units = ['B', 'K', 'M', 'G', 'T'];
    let base = 1;
    while (size > base * 1024 && units.length > 1) {
      units.shift();
      base *= 1024;
    }
    return Math.round(size / base) + units[0];
  },

  formatDate(d) {
    if (!d) {
      return ' ';
    }
    return dayjs(d).format('MM-DD HH:mm');
  },

  async parallel(jobs, fn, workerCount = 5) {
    let cursor = 0;

    async function worker(workerId) {
      while (cursor < jobs.length) {
        try {
          cursor += 1;
          await fn(jobs[cursor - 1]);
        } catch (e) {
          console.log(`worker: ${workerId} job: ${cursor - 1}`);
          console.log(e);
        }
      }
      // console.log(`worker ${workerId} exit`);
    }

    const workers = [];

    for (let i = 0; i < workerCount; i += 1) {
      workers.push(worker(i));
    }

    await Promise.all(workers);

    return true;
  }
};
