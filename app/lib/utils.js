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
    const ret = new Array(jobs.length);

    let cursor = 0;

    async function worker(workerId) {
      let currentJob;
      while (cursor < jobs.length) {
        try {
          currentJob = cursor;
          cursor += 1;
          ret[currentJob] = await fn(jobs[currentJob]);
        } catch (e) {
          console.log(`worker: ${workerId} job: ${currentJob}`, e);
        }
      }
    }

    const workers = [];

    for (let i = 0; i < workerCount && i < jobs.length; i += 1) {
      workers.push(worker(i));
    }

    await Promise.all(workers);

    return ret;
  }
};
