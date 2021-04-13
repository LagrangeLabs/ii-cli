'use strict';

class Package {
  constructor(options) {
    this.targetPath = options.targetPath; // package的路径
    this.storePath = options.storePath; // package的存储路径
    this.packageName = options.name;
  }

  // 判断当前Package是否存在
  exists() {}

  // 安装Package
  install() {}

  // 更新Pacakge
  update() {}

  // 获取入口文件的路径
  getRootFilePath() {}
}

module.exports = Package;
