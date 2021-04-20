'use strict';

const path = require('path');
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
    // 通过require的方式来执行该文件(在当前进程中调用)
    // 利用Array.from将类数组直接转化成数据结构
    require(rootFile).call(null, Array.from(arguments));
    // 由于安装文件比较消耗性能，所以需将其放置子进程中
  }
}

module.exports = exec;
