'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const semver = require('semver');
const Command = require('@ii-cli/command');
const log = require('@ii-cli/log');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

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
      const projectInfo = await this.prepare();
      if (projectInfo) {
        // 2. 下载模板
        log.verbose('projectInfo:', projectInfo);
        this.downloadTemplate();
        // 3. 安装模板
      }
    } catch (e) {
      log.error(e.message);
    }
  }

  downloadTemplate() {
    // 通过项目模板API获取项目模板信息
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

    return this.getProjectInfo();
  }

  async getProjectInfo() {
    let projectInfo = {};

    // 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT,
        },
        {
          name: '组件',
          value: TYPE_COMPONENT,
        },
      ],
    });

    log.verbose('创建类型：', type);

    if (type === TYPE_PROJECT) {
      // 获取项目的基本信息
      const info = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          default: '',
          validate: function (v) {
            const done = this.async();
            setTimeout(function () {
              /**
               * 验证规则：
               * + 首字符必须以`ii`开头；
               * + 尾字符必须以`fe`结尾；
               * + 字符仅允许中划线`-`
               *
               * 举例：ii-brain-fe 合法
               */
              if (!/^ii([-][a-zA-Z]+)+-fe$/.test(v)) {
                done('请输入合法的项目名称，eg: ii-brain-fe');
                return;
              }

              // Pass the return value in the done callback
              done(null, true);
            }, 0);
            return;
          },
          filter: function (v) {
            // 过滤
            return v;
          },
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入项目版本号',
          default: '1.0.0',
          validate: function (v) {
            const done = this.async();
            setTimeout(function () {
              // 借助semver判断版本号
              if (!semver.valid(v)) {
                done('请输入合法的项目版本号，eg: 1.0.0');
                return;
              }

              // Pass the return value in the done callback
              done(null, true);
            }, 0);
            return;
          },
          filter: function (v) {
            if (!!semver.valid(v)) {
              return semver.valid(v);
            } else {
              return v;
            }
          },
        },
      ]);

      projectInfo = {
        type,
        ...info,
      };
    } else if (type === TYPE_COMPONENT) {
    }

    return projectInfo;
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
