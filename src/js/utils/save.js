const fs = require("fs");

function saveTestData(fileName, data) {
  fs.writeFileSync(`${__dirname}/_test/${fileName}`, JSON.stringify(data));
}

module.exports = { saveTestData };
