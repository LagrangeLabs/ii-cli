'use strict';

const Command = require('@ii-cli/command');

class InitCommand extends Command {
  init() {}

  exec() {}
}

function init(projectName, cmdObj) {
  console.log('init', projectName, cmdObj);
  //   return new InitCommand(argv);
}

module.exports = init;
