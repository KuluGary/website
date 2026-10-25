import fs from "fs";

export function saveTestData(fileName, data) {
  if (process.env.ENVIRONMENT !== "DEVELOPMENT") return;

  fs.writeFileSync(`./src/_data/${fileName}`, JSON.stringify(data));
}
