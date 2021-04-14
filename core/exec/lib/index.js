'use strict';

module.exports = exec;

const log = require('@ii-cli/log');
const Package = require('@ii-cli/package');

const SETTINGS = {
  init: '@ii-cli/init',
};

function exec() {
  const targetPath = process.env.CLI_TARGET_PATH;

  // 参数是通过command传递进来的，数量不定。可以通过arguments来进行处理
  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';

  const pkg = new Package({
    targetPath,
    packageName,
    packageVersion,
  });
  console.log('pkg:', pkg.getRootFilePath());
}
