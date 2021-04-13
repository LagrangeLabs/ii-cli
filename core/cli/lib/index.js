'use strict';

const path = require('path');
const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const pathExists = require('path-exists').sync; // 使用同步
const commander = require('commander');
const pkg = require('../package.json');
const log = require('@ii-cli/log');
const init = require('@ii-cli/init');
const exec = require('@ii-cli/exec');
const { LOWEST_NODE_VERSION, DFT_CLI_HOME } = require('./const');

const program = new commander.Command(); // 实例化一个脚手架对象

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
  }
}

/**
 * 进行预准备
 */
async function prepare() {
  checkPkgVer();
  checkNodeVer();
  checkRoot();
  checkUserHome();
  checkEnv();
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

/**
 * 检查环境变量
 */
function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');

  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }

  createDftEnvCfg();
}

/**
 * 创建默认的环境变量
 */
function createDftEnvCfg() {
  const envConfig = {
    home: userHome,
  };

  if (process.env.CLI_HOME) {
    envConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
  } else {
    envConfig['cliHome'] = path.join(userHome, DFT_CLI_HOME);
  }

  process.env.CLI_HOME_PATH = envConfig.cliHome;
}

/**
 * 进行命令的注册
 */
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0]) // 注册脚手架名称
    .usage('<command> [options]')
    .version(pkg.version) //注册版本号
    .option('-d, --debug', '是否开启调试模式', true) // 为脚手架加上全局属性
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

  // 进行命令注册
  program.command('init [projectName]').option('-f, --force', '是否强制初始化项目').action(exec);

  // 监听targetPath
  program.on('option:targetPath', function () {
    const options = program.opts();

    // 通过设置环境变量来进行业务逻辑的解耦，避免进行参数传递
    process.env.CLI_TARGET_PATH = options.targetPath;
  });

  // 监听debug时间，开启DEBUG模式
  program.on('option:debug', function () {
    const options = program.opts();
    if (options.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }

    // 由于 require 是同步方法，导致 log = require('@ii-cli/log') 会先执行，所以此处要对 log.level 进行手动修改
    log.level = process.env.LOG_LEVEL;
  });

  // 监听未知命令
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    console.log(colors.red('未知命令：' + obj[0]));

    if (availableCommands.length > 0) {
      console.log(colors.red('可用的命令：' + availableCommands.join(',')));
    }
  });

  if (program.args && program.args.length < 1) {
    program.outputHelp(); // 未输入其他命令，输出帮助
    console.log(); // 添加空行
  } else {
    program.parse(process.argv);
  }
}

module.exports = core;
