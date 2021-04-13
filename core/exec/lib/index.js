'use strict';

module.exports = exec;

const Package = require('@ii-cli/package');

function exec() {
  // TODO
  const pkg = new Package();
  console.log('targetPath:', pkg);
  console.log(process.env.CLI_TARGET_PATH);

  // 1. targetPath => modulePath
  // 2. modulePath => Package(npm模块)
  // 3. Package.getRootFile(获取入口文件)
  // 4. Package.update/ Package.install

  // 封装 -> 复用
}
