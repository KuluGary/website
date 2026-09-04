import fs from "node:fs/promises";
import path from "node:path";
import markdownIt from "markdown-it";

const DATA_FILE = "./src/data/links.json";
const CONTENT_DIR = "./src";

const md = new markdownIt({
  html: true,
  breaks: false,
});

const links = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));

async function getMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getMarkdownFiles(fullPath)));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractUrls(content) {
  const tokens = md.parse(content, {});
  const urls = new Set();

  for (const token of tokens) {
    if (token.type !== "inline" || !token.children) {
      continue;
    }

    for (const child of token.children) {
      if (child.type !== "link_open") {
        continue;
      }

      const href = child.attrGet("href");

      if (href && /^https?:\/\//.test(href)) {
        urls.add(href);
      }
    }
  }

  return [...urls];
}

const files = await getMarkdownFiles(CONTENT_DIR);
const urls = new Set();

for (const file of files) {
  const content = await fs.readFile(file, "utf8");

  for (const url of extractUrls(content)) {
    urls.add(url);
  }
}

let added = 0;

for (const url of urls) {
  if (links[url]) {
    continue;
  }

  links[url] = {
    firstSeen: new Date().toISOString(),
    lastChecked: null,
    status: null,
    wayback: null,
    error: null,
    result: null,
  };

  added++;
  console.log(`New link: ${url}`);
}

await fs.writeFile(DATA_FILE, `${JSON.stringify(links, null, 2)}\n`);

console.log(`Added ${added} new links.`);
