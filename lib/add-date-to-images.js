import fs from "fs-extra";
import path from "path";
import { DateTime } from "luxon";

const inputPath = "./src/art";

function main() {
  try {
    const items = fs.readdirSync(inputPath);

    for (const item of items) {
      const fullPath = path.join(inputPath, item);
      const itemPath = path.join(fullPath, "index.md");

      if (fs.existsSync(itemPath)) {
        const data = fs.readFileSync(itemPath, { encoding: "utf8" });
        const regex = /date:.*/;

        const rawDate = data.match(regex).at(0).replace("date: ", "");
        const date = formatDate(rawDate);

        if (date) {
          const newFolder = path.join(inputPath, `${date}-${item}`);

          rename(fullPath, newFolder);
        }
      }
    }

    process.exit();
  } catch (error) {
    process.exit(1);
  }
}

function formatDate(date) {
  return DateTime.fromJSDate(new Date(date)).toFormat("yyyy-MM-dd");
}

function rename(path, newPath) {
  if (fs.existsSync(newPath)) {
    throw new Error("Already exists");
  }

  if (fs.lstatSync(path).isDirectory()) {
    fs.copySync(path, newPath);
    fs.rmdirSync(path, { recursive: true });
  } else if (fs.lstatSync(path).isFile()) {
    fs.renameSync(path, newPath);
  }
}

main();
