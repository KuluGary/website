const { default: puppeteer } = require("puppeteer");
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const log = require("../js/utils/log");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { saveTestData } = require("../js/utils/save");

const TRAKT_USER = "kulugary";
const TRAKT_PAGES = {
  favorites: `https://trakt.tv/users/${TRAKT_USER}/favorites?display=show&sort=released%2Casc`,
  dropped: `https://trakt.tv/users/${TRAKT_USER}/lists/dropped?display=show&sort=rank%2Casc`,
  watchlist: `https://trakt.tv/users/${TRAKT_USER}/watchlist?display=show&sort=rank%2Casc`,
  seen: `https://trakt.tv/users/${TRAKT_USER}/lists/seen?display=show&sort=rank%2Casc`,
};

const coverPath = "src/assets/images/covers/shows";

/**
 * Recursively scrapes show data from Trakt.TV structured pages.
 */
async function traverseAndScrape(pages, pathParts, target, page) {
  for (const [key, value] of Object.entries(pages)) {
    const currentPath = [...pathParts, key];
    if (typeof value === "string") {
      const scraped = await scrapeShowPage(page, value, currentPath.join("/"));
      setNested(target, currentPath, scraped);
    } else if (typeof value === "object") {
      if (!target[key]) target[key] = {};
      await traverseAndScrape(value, currentPath, target, page);
    }
  }
}

/**
 * Scrapes a single Trakt show list page.
 */
async function scrapeShowPage(page, url, relativeFolder) {
  log("[Trakt.tv/Shows]", `🔎 Scraping page: ${url}`);
  const results = [];

  try {
    await page.goto(url);
    await page.waitForSelector("#sortable-grid");
    const elements = await page.$$("#sortable-grid .grid-item");

    for (const element of elements) {
      try {
        const [titleEl, linkEl, imageEl] = await Promise.all([
          element.$(".titles h3"),
          element.$("a"),
          element.$("img.real"),
        ]);

        const [title, link, imageSrc, originalTitle, id] = await Promise.all([
          titleEl.evaluate((el) => el.innerText),
          linkEl.evaluate((el) => el.href),
          imageEl.evaluate((el) => el.src),
          element.evaluate((el) => el.getAttribute("data-title")),
          element.evaluate((el) => el.getAttribute("data-list-item-id")),
        ]);

        const safeName = sanitizeFilename(originalTitle);
        const imagePath = await downloadImage(relativeFolder, imageSrc, safeName);

        results.push({ id, title, link, imagePath });
      } catch (innerErr) {
        log("[Trakt.tv/Shows]", `⚠️ Skipped one element in ${relativeFolder}: ${innerErr.message}`);
      }
    }
  } catch (err) {
    log("[Trakt.tv/Shows]", `❌ Failed to scrape ${relativeFolder}: ${err.message}`);
  }

  return results;
}

/**
 * Downloads and saves an image locally.
 */
async function downloadImage(folder, url, fileName) {
  const dir = path.join(coverPath, folder);
  fs.mkdirSync(dir, { recursive: true });

  const fullPath = path.join(dir, `${fileName}.jpg`);
  const buffer = await fetch(url).then((res) => res.buffer());

  fs.writeFileSync(fullPath, buffer);
  return fullPath;
}

/**
 * Sanitizes a filename for safe usage.
 */
function sanitizeFilename(name) {
  return name?.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim() || "unknown";
}

/**
 * Deep-sets a value into a nested object path.
 */
function setNested(obj, keys, value) {
  let current = obj;
  keys.slice(0, -1).forEach((key) => {
    if (!current[key]) current[key] = {};
    current = current[key];
  });
  current[keys[keys.length - 1]] = value;
}

/**
 * Main entry point for module: scrapes and caches shows data.
 * @returns {Promise<Object>} Scraped shows data.
 */
module.exports = async function fetchTraktShows() {
  const cached = getFromCache("shows");
  if (cached) {
    log("[Trakt.tv/Shows]", "🗃️ Returning cached data");
    return cached;
  }

  log("[Trakt.tv/Shows]", "🎞️ Starting fresh scrape");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  const showCollection = {};
  await traverseAndScrape(TRAKT_PAGES, [], showCollection, page);

  await browser.close();

  setIntoCache("shows", showCollection);
  saveTestData("shows.json", showCollection);

  log("[Trakt.tv/Shows]", "✅ Scraped and cached show data");
  return showCollection;
};
