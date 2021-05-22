'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const semver = require('semver');
const ejs = require('ejs');
const glob = require('glob');
const Command = require('@ii-cli/command');
const userHome = require('user-home');
const Package = require('@ii-cli/package');
const log = require('@ii-cli/log');
const { spinnerStart, sleep, execAsync } = require('@ii-cli/utils');

const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

const TEMPLATE_TYPE_NORMAL = 'normal'; // 标准模板
const TEMPLATE_TYPE_CUSTOM = 'custom'; // 自定义模板

const WHITE_COMMAND = ['npm', 'cnpm']; // 添加命令白名单，防止有非法命令

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
        this.projectInfo = projectInfo;
        await this.downloadTemplate();
        // 3. 安装模板
        await this.installTemplate();
      }
    } catch (e) {
      log.error(e.message);
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log('错误栈：', e);
      }
    }
  }

  // 安装模板
  async installTemplate() {
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
      }

      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        await this.installNormalTemplate();
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        await this.installCustomTemplate();
      } else {
        throw new Error('无法识别项目模板类型');
      }
    } else {
      throw new Error('项目模板信息不存在!');
    }
  }

  /**
   * 检查命令是否在白名单里
   */
  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd;
    }

    return null;
  }

  /**
   * 执行命令
   */
  async execCommand(command, errMsg) {
    let ret;

    if (command) {
      const cmdArray = command.split(' ');
      const cmd = this.checkCommand(cmdArray[0]);
      if (!cmd) {
        throw new Error(`命令 '${command}' 无法执行!`);
      }
      const args = cmdArray.slice(1);

      ret = await execAsync(cmd, args, {
        stdio: 'inherit', // 在当前的主进行进行打印
        cwd: process.cwd(),
      });
    }

    if (ret !== 0) {
      throw new Error(errMsg);
    }
  }

  async renderEjs(options) {
    const dir = process.cwd();

    return new Promise((resolve, reject) => {
      // 遍历当前整个目录
      glob(
        '**',
        {
          cwd: dir,
          ignore: options.ignore || '', // 忽略哪些文件夹
          nodir: true, // 不处理目录
        },
        (err, files) => {
          if (err) {
            reject(err);
          }

          Promise.all(
            files.map((file) => {
              const filePath = path.join(dir, file);

              return new Promise((resolve1, reject1) => {
                ejs.renderFile(filePath, this.projectInfo, {}, (err, result) => {
                  // console.log(err, result);

                  if (err) {
                    reject1(err);
                  } else {
                    fse.writeFileSync(filePath, result); // 完成真实的文件写入
                    resolve1(result);
                  }
                });
              });
            })
          )
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });

          console.log('files:', files);
        }
      );
    });
  }

  // 标准模板安装
  async installNormalTemplate() {
    let spinner = spinnerStart('正在安装模板...');
    // await sleep(5000);

    try {
      // 拷贝模板代码至当前目录
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
      const targetPath = process.cwd(); // 获取当前目录

      // 确保这两个目录都存在(若不存在则创建这些目录)
      fse.ensureDirSync(templatePath);
      fse.ensureDirSync(targetPath);

      // 从缓存目录拷贝到目标目录
      fse.copySync(templatePath, targetPath);
    } catch (e) {
      throw e;
    } finally {
      spinner.stop(true);
      log.success('模板安装成功');
    }

    const ignore = ['node_modules/**', 'src/pages/document.ejs'];
    await this.renderEjs({ ignore });

    // 安装依赖
    const { installCommand, startCommand } = this.templateInfo;

    await this.execCommand(installCommand, '依赖安装过程中出现失败');
    await this.execCommand(startCommand, '启动执行命令失败');
  }

  // 自定义模板安装
  async installCustomTemplate() {
    console.log('安装自定义模板');
  }

  async downloadTemplate() {
    // 通过项目模板API获取项目模板信息
    const { projectTemplate } = this.projectInfo;

    const templateInfo = this.template.find((item) => item.npmName === projectTemplate);
    this.templateInfo = templateInfo;

    // 专门用户缓存项目模板
    const targetPath = path.resolve(userHome, '.ii-cli', 'template');
    const storeDir = path.resolve(userHome, '.ii-cli', 'template', 'node_modules');

    const { npmName, version } = templateInfo;
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });

    if (!(await templateNpm.exists())) {
      const spinner = spinnerStart('正在下载模板...');
      await sleep();

      try {
        await templateNpm.install();
      } catch (err) {
        throw err;
      } finally {
        spinner.stop(true); // true 表示清除loading文字
        if (await templateNpm.exists()) {
          log.success('模板下载成功');
        }
        this.templateNpm = templateNpm;
      }
    } else {
      const spinner = spinnerStart('正在更新模板...');
      await sleep();

      try {
        await templateNpm.update();
      } catch (err) {
        throw err;
      } finally {
        spinner.stop(true);
        if (await templateNpm.exists()) {
          log.success('模板更新成功');
        }
        this.templateNpm = templateNpm;
      }
    }
  }

  async prepare() {
    // 判断项目模板是否存在
    const template = await getProjectTemplate();
    if (!template || template.length === 0) {
      throw new Error('项目模板不存在');
    }
    this.template = template;

    // 判断当前目录是否为空
    const localPath = process.cwd();
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
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择项目模板',
          choices: this.createTemplateChoice(),
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

  createTemplateChoice() {
    return this.template.map((item) => ({
      value: item.npmName,
      name: item.name,
    }));
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
