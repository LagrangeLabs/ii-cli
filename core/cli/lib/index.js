'use strict';

module.exports = core;

const pkg = require('../package.json');
const log = require('@ii-cli/log');

function core() {
  checkPkgVer();
}

function checkPkgVer() {
  log.info('cli', pkg.version);
}
