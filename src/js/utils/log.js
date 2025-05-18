const chalk = require("chalk");
const { Duration } = require("luxon");

let startDate;

function log(key, logMessage) {
  console.log(chalk.blue(key), logMessage);
}

function time(key, logMessage) {
  startDate = new Date().getTime();
  log(key, logMessage);
}

function timeEnd(key, logMessage) {
  if (!startDate) throw new Error("You need to call the time function before ending it.");

  const endDate = new Date().getTime();
  const diffInMillis = endDate - startDate;

  const duration = Duration.fromMillis(diffInMillis).shiftTo("minutes");

  const minutes = String(duration.minutes.toFixed(2)).padStart(2, "0");

  log(key, `${logMessage} in ${minutes}m`);
  startDate = undefined;
}

module.exports = {
  log,
  time,
  timeEnd,
};
