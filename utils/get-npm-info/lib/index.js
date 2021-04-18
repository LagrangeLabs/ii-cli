'use strict';

const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');

// 从 registry 中获取 npm 的信息
function getNpmInfo(npm, registry) {
  const register = registry || getDftRegistry();
  const url = urlJoin(register, npm);

  return axios.get(url).then(function (response) {
    try {
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      return Promise.reject(error);
    }
  });
}

async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

function getDftRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
}

async function getNpmLatestVersion(npmName, registry) {
  let versions = await getNpmVersions(npmName, registry);
  if (versions) {
    return versions.sort((a, b) => semver.gt(b, a))[0];
  }

  return null;
}

module.exports = {
  getNpmInfo,
  getDftRegistry,
  getNpmLatestVersion,
};
