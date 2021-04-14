'use strict';

const path = require('path');

/**
 * 对路径进行兼容(兼容macOS/windows)
 */
function formatPath(p) {
  if (p && typeof p === 'string') {
    const sep = path.sep; // 分隔符

    if (sep === '/') {
      return p;
    } else {
      return p.replace(/\\/g, '/'); // 针对windows电脑，做兼容处理
    }
  }

  return p;
}

module.exports = formatPath;
