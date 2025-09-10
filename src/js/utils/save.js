const fs = require("fs");

function saveTestData(fileName, data) {
  if (process.env.ENVIRONMENT !== "DEVELOPMENT") return;
  fs.writeFileSync(`${__dirname}/_test/${fileName}`, JSON.stringify(data));
}

module.exports = { saveTestData };
