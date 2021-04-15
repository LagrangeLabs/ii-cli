'use strict';

module.exports = exec;

const path = require('path');
const log = require('@ii-cli/log');
const Package = require('@ii-cli/package');

const SETTINGS = {
  init: '@ii-cli/init',
};

const CACHE_DIR = 'dependencies';

function exec() {
  let storeDir = '';
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
  }

  const pkg = new Package({
    targetPath,
    storeDir,
    packageName,
    packageVersion,
  });
  console.log('pkg:', pkg.getRootFilePath());
}
