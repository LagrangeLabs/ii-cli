'use strict';

function getNpmInfo() {
  // TODO
}

function getDftRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
}

module.exports = {
  getNpmInfo,
  getDftRegistry,
};
