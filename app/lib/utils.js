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
  }
};
