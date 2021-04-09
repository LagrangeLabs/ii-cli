'use strict';

const Command = require('@ii-cli/command');

class InitCommand extends Command {
  init() {}

  exec() {}
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
