'use strict';

const path = require('path');
const cp = require('child_process');
const log = require('@ii-cli/log');
const Package = require('@ii-cli/package');

const SETTINGS = {
  init: '@ii-cli/utils',
};

const CACHE_DIR = 'dependencies';

async function exec() {
  let storeDir = '';
  let pkg;
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;

  // 参数是通过command传递进来的，数量不定。可以通过arguments来进行处理
  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
    storeDir = path.resolve(targetPath, 'node_modules');

    log.verbose('targetPath:', targetPath);
    log.verbose('storeDir:', storeDir);

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });

    if (await pkg.exists()) {
      // 更新package
      await pkg.update();
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
  }

  const rootFile = pkg.getRootFilePath();
  if (rootFile) {
    // 注：exec方法是异步执行，针对这个Promise的异常需单独添加异常捕获
    try {
      // 通过require的方式来执行该文件(在当前进程中调用)
      // 利用Array.from将类数组直接转化成数据结构
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null); //创建一个没有原型链的对象
      Object.keys(cmd).forEach((key) => {
        // 判断是否是原型链上的property
        if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;

      // 由于安装文件比较消耗性能，所以需将其放置子进程中
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });

      // 监测命令执行失败
      child.on('error', (e) => {
        log.error(e.message);
        process.exit(1);
      });

      child.on('exit', (e) => {
        log.verbose('命令执行成功：', e);
        process.exit(e);
      });
    } catch (e) {
      log.error(e.message);
    }
  }
}

function spawn(command, args, options) {
  const win32 = process.platform === 'win32';

  // cmd 是执行的主参数
  const cmd = win32 ? 'cmd' : command;
  // 'c' 表示静默执行
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

  return cp.spawn(cmd, cmdArgs, options || {});
}

module.exports = exec;
