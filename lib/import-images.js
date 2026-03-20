import fs from "fs";
import path from "path";

async function walk(currentPath) {
  const items = fs.readdirSync(currentPath);

  for (const item of items) {
    const fullPath = path.join(currentPath, item);
    const stat = fs.lstatSync(fullPath);

    if (stat.isDirectory()) {
      await walk(fullPath);
    } else {
      await handleFile(fullPath);
    }
  }
}

async function handleFile(filePath) {
  const fileName = filePath.split("\\").pop();
  const fileNameWithouthExtension = fileName.split(".").shift();

  const targetFolder = "./src/art";
  const titleDate = extractDate(fileNameWithouthExtension);
  const fileDate = getCreationDate(filePath);

  const parsedFileName = fileNameWithouthExtension.replace(titleDate, "").trim();

  const targetDir = targetFolder + "/" + slugify(parsedFileName);
  const doesFolderExist = fs.existsSync(targetDir);

  if (!doesFolderExist) {
    fs.mkdirSync(targetDir, { recursive: true });
    // fs.mkdir(targetDir + "/assets", { recursive: true });
    fs.writeFileSync(
      targetDir + "/index.md",
      `---
title: "${parsedFileName}"
date: ${titleDate ? toISO(titleDate) : fileDate.toISOString()}
---`
    );

    fs.cpSync(filePath, targetDir + `/assets/index.png`);
  }
}

function slugify(str) {
  return String(str)
    .normalize("NFKD") // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens
}

function extractDate(str) {
  const match = str.match(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}/);
  return match ? match[0] : undefined;
}

function getCreationDate(filePath) {
  const stats = fs.statSync(filePath);
  return new Date(stats.birthtime);
}

function toISO(str) {
  const match = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return undefined;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

walk("E:/Usuarios/garyc/Pictures/Art/KuluGary/PNGs");
