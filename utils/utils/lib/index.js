'use strict';

const cp = require('child_process');

/**
 * 判断参数是否是对象
 *
 * 注：不能通过typeof，因为[]也会判断成object。正常情况应该调用Object.prototype.toString方法来进行判断
 */
function isObject(obj) {
  return Object.prototype.toString.call(obj) === `[object Object]`;
}

function spinnerStart(msg, spinnerString = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner;

  const spinner = new Spinner(msg + ' %s');
  spinner.setSpinnerString(spinnerString);
  spinner.start();

  return spinner;
}

function sleep(timeout = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

function exec(command, args, options) {
  const win32 = process.platform === 'win32';

  // cmd 是执行的主参数
  const cmd = win32 ? 'cmd' : command;
  // 'c' 表示静默执行
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

  return require('child_process').spawn(cmd, cmdArgs, options || {});
}

function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options);

    p.on('error', (e) => {
      reject(e);
    });

    p.on('exit', (c) => {
      resolve(c);
    });
  });
}

module.exports = {
  isObject,
  sleep,
  spinnerStart,
  exec,
  execAsync,
};
