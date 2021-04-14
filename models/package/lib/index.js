'use strict';

const path = require('path');
const pkgDir = require('pkg-dir').sync; // 使用同步方法
const { isObject } = require('@ii-cli/utils');
const formatPath = require('@ii-cli/format-path');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空');
    }

    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象!');
    }

    this.targetPath = options.targetPath; // package的路径
    this.storePath = options.storePath; // package的存储路径
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
  }

  // 判断当前Package是否存在
  exists() {}

  // 安装Package
  install() {}

  // 更新Pacakge
  update() {}

  // 获取 package.json 指定的入口文件路径
  getRootFilePath() {
    const dir = pkgDir(this.targetPath); //  获取package.json所在目录

    if (dir) {
      const pkgFile = require(path.resolve(dir, 'package.json'));
      if (pkgFile && pkgFile.main) {
        return formatPath(path.resolve(dir, pkgFile.main)); // 找到main指定的文件
      }
    }

    return null;
  }
}

module.exports = Package;
