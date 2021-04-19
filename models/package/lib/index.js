'use strict';

const path = require('path');
const fse = require('fs-extra');
const pkgDir = require('pkg-dir').sync; // 使用同步方法
const pathExists = require('path-exists').sync;
const npminstall = require('npminstall');
const { isObject } = require('@ii-cli/utils');
const formatPath = require('@ii-cli/format-path');
const { getDftRegistry, getNpmLatestVersion } = require('@ii-cli/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空');
    }

    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象!');
    }

    this.targetPath = options.targetPath; // package的路径
    this.storeDir = options.storeDir; // 缓存package的路径
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir); // 将当前路径下所有没创建的目录都创建完
    }

    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }

    console.log('prepare:', this.packageVersion);
  }

  get cacheFilePath() {
    // 举例：将 @ii-cli/utils => _@ii-cli_utils@1.0.6@@ii-cli
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }

  getSpecificCacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }

  // 判断当前Package是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      console.log(this.cacheFilePath);
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }

  // 安装Package
  async install() {
    await this.prepare();

    // npminstall 返回的是Promise
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDftRegistry(),
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }

  // 更新Pacakge
  async update() {
    await this.prepare();

    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    // 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    // 如果不存在，则安装最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDftRegistry(),
        pkgs: [{ name: this.packageName, version: latestPackageVersion }],
      });
      this.packageVersion = latestPackageVersion;
    }
  }

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
