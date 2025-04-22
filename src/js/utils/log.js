const chalk = require("chalk");

function log(key, logMessage) {
  console.log(chalk.blue(key), logMessage);
}

module.exports = log;
