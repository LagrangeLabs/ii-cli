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
    checkRoot();
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

/**
 * 检查 root 账户
 *
 * + 避免 root 账户创建的文件无法进行修改
 * + 通过 root-check 对用户进行了降级
 */
function checkRoot() {
  // root-check 利用 process.getuid API 可以获取当前用户登录的 id(默认是 501)。如果通过 sudo 启动，则是0(即超级管理员，root账户)
  // root-check 利用 process.setuid/process.setgid API 来修改用户登录的id
  const rootCheck = require('root-check');
  rootCheck();
}

module.exports = core;
