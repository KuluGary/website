const { default: puppeteer } = require("puppeteer");
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const log = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");

const coverPath = "src/assets/images/covers/movies";

const TRAKT_PAGES = {
  favorites: "https://trakt.tv/users/kulugary/favorites?display=movie&sort=released%2Casc",
  dropped: "https://trakt.tv/users/kulugary/lists/dropped?display=movie&sort=rank%2Casc",
  watchlist: "https://trakt.tv/users/kulugary/watchlist?display=movie&sort=rank%2Casc",
  seen: "https://trakt.tv/users/kulugary/lists/seen?display=movie&sort=rank%2Casc",
};

/**
 * Recursively scrapes each page or nested group of pages.
 */
async function traverseAndScrape(pages, pathParts, target, page) {
  for (const [key, value] of Object.entries(pages)) {
    const currentPath = [...pathParts, key];
    if (typeof value === "string") {
      const scraped = await scrapeMoviePage(page, value, currentPath.join("/"));
      setNested(target, currentPath, scraped);
    } else if (typeof value === "object") {
      if (!target[key]) target[key] = {};
      await traverseAndScrape(value, currentPath, target, page);
    }
  }
}

/**
 * Scrapes a single Trakt page for movie entries.
 */
async function scrapeMoviePage(page, url, relativeFolder) {
  log("[Trakt.tv/Movies]", `🔎 Scraping page: ${url}`);
  await page.goto(url);
  await page.waitForSelector("#sortable-grid");

  const movies = [];
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

      movies.push({ id, title, link, imagePath });
    } catch (err) {
      log("[Trakt.tv/Movies]", "⚠️ Failed to scrape an element", err.message);
    }
  }

  return movies;
}

/**
 * Downloads a cover image locally.
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
 * Sanitizes filenames for safe file system usage.
 */
function sanitizeFilename(name) {
  return name?.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim() || "unknown";
}

/**
 * Sets a nested value into an object given a path.
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
 * Main entry point for module: scrapes and caches movies data.
 * @returns {Promise<Object>} Scraped movies data.
 */
module.exports = async function fetchTraktMovies() {
  const cached = getFromCache("movies");
  if (cached) {
    log("[Trakt.tv/Movies]", "🗃️ Returning cached data");
    return cached;
  }

  log("[Trakt.tv/Movies]", "🎞️ Starting fresh scrape");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  const movieCollection = {};
  await traverseAndScrape(TRAKT_PAGES, [], movieCollection, page);

  await browser.close();

  setIntoCache("movies", movieCollection);
  saveTestData("movies.json", movieCollection);

  log("[Trakt.tv/Movies]", "✔️ Scraping complete");
  return movieCollection;
};
