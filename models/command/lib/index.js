'use strict';

const semver = require('semver');
const colors = require('colors/safe');

const LOWEST_NODE_VERSION = '12.0.0';

class Command {
  constructor(argv) {
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVer());
    });
  }

  // 避免部分 Node API 在低版本时不支持
  checkNodeVer() {
    const currentVer = process.version;
    if (!semver.gte(currentVer, LOWEST_NODE_VERSION)) {
      throw new Error(colors.red(`ii-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的Node.js`));
    }
  }

  init() {
    // 通过这种方式强制父类必须实现该方法
    throw new Error('必须实现init');
  }

  exec() {
    // 通过这种方式强制父类必须实现该方法
    throw new Error('必须实现exec');
  }
}

module.exports = Command;
