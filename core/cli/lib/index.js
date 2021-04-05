'use strict';

const semver = require('semver');
const colors = require('colors/safe');
const pkg = require('../package.json');
const log = require('@ii-cli/log');
const { LOWEST_NODE_VERSION } = require('./const');

function core() {
  try {
    checkPkgVer();
    checkNodeVer();
  } catch (e) {
    log.error(e.message);
  }
}

function checkPkgVer() {
  log.info('cli', pkg.version);
}

// 避免部分 Node API 在低版本时不支持
function checkNodeVer() {
  const currentVer = process.version;
  if (!semver.gte(currentVer, LOWEST_NODE_VERSION)) {
    throw new Error(colors.red(`ii-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的Node.js`));
  }
}

module.exports = core;
