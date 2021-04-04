#! /usr/bin/env node

const importLocal = require('import-local');

if (importLocal(__filename)) {
  require('npmlog').info('cli', "is running ii-cli local's version");
} else {
  require('../lib')(process.argv.slice(2));
}
