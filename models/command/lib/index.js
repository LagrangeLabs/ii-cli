'use strict';

const semver = require('semver');
const colors = require('colors/safe');
const log = require('@ii-cli/log');

const LOWEST_NODE_VERSION = '12.0.0';

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error('参数不能为空!');
    }

    if (!Array.isArray(argv)) {
      throw new Error('参数必须为数组!');
    }

    if (argv.length < 1) {
      throw new Error('参数列表为空!');
    }

    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      // 每新建一个Promise，都要有单独的 try-catch 逻辑
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVer());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain.catch((err) => {
        log.error(err.message);
      });
    });
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
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
