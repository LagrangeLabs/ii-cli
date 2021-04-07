'use strict';

const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const pathExists = require('path-exists').sync; // 使用同步
const pkg = require('../package.json');
const log = require('@ii-cli/log');
const { LOWEST_NODE_VERSION } = require('./const');

let args;

function core() {
  try {
    checkPkgVer();
    checkNodeVer();
    checkRoot();
    checkUserHome();
    checkInputArgs();
    log.verbose('debug', 'test debug log');
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
  // root-check 利用 process.getuid API 可以获取当前用户登录的 id(darwin操作系统默认是 501)。如果通过 sudo 启动，则是0(darwin操作系统 0 表示是超级管理员，即root账户)
  // root-check 利用 process.setuid/process.setgid API 来修改用户登录的id
  const rootCheck = require('root-check');
  rootCheck();
}

// 检查用户主目录是否存在
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户的主目录不存在'));
  }
}

function checkInputArgs() {
  const minimist = require('minimist');
  args = minimist(process.argv.slice(2));

  checkArgs();
}

function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose';
  } else {
    process.env.LOG_LEVEL = 'info';
  }

  // 由于 require 是同步方法，导致 log = require('@ii-cli/log') 会先执行，所以此处要对 log.level 进行手动修改
  log.level = process.env.LOG_LEVEL;
}

module.exports = core;
