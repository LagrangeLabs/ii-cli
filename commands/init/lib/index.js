'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const Command = require('@ii-cli/command');
const log = require('@ii-cli/log');

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._argv[1].force;

    log.verbose('projectName:', this.projectName);
    log.verbose('force:', this.force);
  }

  async exec() {
    try {
      // 1. 准备阶段
      const ret = await this.prepare();
      if (ret) {
        // 2. 下载模板
        // 3. 安装模板
      }
    } catch (e) {
      log.error(e.message);
    }
  }

  async prepare() {
    const localPath = process.cwd();

    // 判断当前目录是否为空
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      if (!this.force) {
        // 询问是否继续创建(将询问结果赋值给ifContinue)
        ifContinue = (
          await inquirer.prompt({
            type: 'confirm',
            name: 'ifContinue',
            default: false,
            message: '当前文件夹不为空，是否继续创建项目？',
          })
        ).ifContinue;

        if (!ifContinue) return;
      }

      // 是否启动强制更新
      if (ifContinue || this.force) {
        // 给用户进行二次确认(清空影响范围大)
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: '是否确认清空当前目录下的文件？',
        });

        if (confirmDelete) {
          // 清空当前目录
          fse.emptyDirSync(localPath);
        }
      }
    }

    // 3. 选择创建项目或组件
    // 4. 获取项目的基本信息
  }

  isDirEmpty(localPath) {
    // 读取当前目录下的所有代码文件
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter((file) => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0);

    return !fileList || fileList.length <= 0;
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
