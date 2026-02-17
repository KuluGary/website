import fs from "fs";

export function saveTestData(fileName, data) {
  fs.writeFileSync(`./src/_data/${fileName}`, JSON.stringify(data));
}
