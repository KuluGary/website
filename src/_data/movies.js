const { default: puppeteer } = require("puppeteer");
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const log = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");
const delay = require("../js/utils/delay");

const TRAKT_USER = "kulugary";
const TRAKT_PAGES = {
  favorites: `https://trakt.tv/users/${TRAKT_USER}/favorites?display=movie&sort=released%2Casc`,
  dropped: `https://trakt.tv/users/${TRAKT_USER}/lists/dropped?display=movie&sort=rank%2Casc`,
  watchlist: `https://trakt.tv/users/${TRAKT_USER}/watchlist?display=movie&sort=rank%2Casc`,
  seen: `https://trakt.tv/users/${TRAKT_USER}/lists/seen?display=movie&sort=rank%2Casc`,
};

const coverPath = "assets/images/covers/movies";

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
  const browser = page.browser();
  log("[Trakt.tv/Movies]", `🔎 Scraping page: ${url}`);
  await page.goto(url);
  await page.waitForSelector("#sortable-grid").catch(() => null);

  const movies = [];
  const elements = await page.$$("#sortable-grid .grid-item").catch(() => null);

  for (const element of elements) {
    try {
      const [titleEl, linkEl, imageEl] = await Promise.all([
        element.$(".titles h3"),
        element.$("a"),
        element.$("img.real"),
      ]);

      const [title, link, imageSrc, originalTitle, id, date_created, date_added] = await Promise.all([
        titleEl.evaluate((el) => el.innerText),
        linkEl.evaluate((el) => el.href),
        imageEl.evaluate((el) => el.src),
        element.evaluate((el) => el.getAttribute("data-title")),
        element.evaluate((el) => el.getAttribute("data-list-item-id")),
        element.evaluate((el) => el.getAttribute("data-released")),
        element.evaluate((el) => el.getAttribute("data-added")),
      ]);

      const newPage = await browser.newPage();
      newPage.goto(link);
      await delay(2000);

      const pages = await browser.pages();
      const profilePage = pages[pages.length - 1];

      await profilePage.bringToFront();
      const { description, genres } = await scrapeMovieProfile(profilePage);
      await profilePage.close();

      const safeName = sanitizeFilename(originalTitle);
      const imagePath = await downloadImage(relativeFolder, imageSrc, safeName);

      movies.push({
        id,
        type: "Movie",
        title,
        description,
        genres,
        link,
        thumbnail: imagePath,
        createdAt: date_created,
        addedAt: date_added,
      });
    } catch (err) {
      log("[Trakt.tv/Movies]", "⚠️ Failed to scrape an element", err.message);
    }
  }

  return movies;
}

/**
 * Extracts the description and genres for a movie
 * @param {puppeteer.Page} page Puppeteer page instance for a movie profile.
 * @returns {Promise<{ description: string, genres: Array<string> }>} Object containing the description and genres of a movie
 */
async function scrapeMovieProfile(page) {
  const descriptionSelector = await page.waitForSelector("#overview");
  const description = await descriptionSelector.evaluate((el) => el.innerText);

  const genres = await page.evaluate(() => {
    const genreSelector = Array.from(document.querySelectorAll("span[itemprop='genre']"));

    if (!genreSelector) return [];

    return genreSelector.map((genreElement) => genreElement.innerText.trim());
  });

  return { description, genres };
}

/**
 * Downloads and saves an image locally.
 */
async function downloadImage(folder, url, fileName) {
  const dir = path.join("src/" + coverPath, folder);
  fs.mkdirSync(dir, { recursive: true });

  const fullPath = path.join(dir, `${fileName}.jpg`);
  const buffer = await fetch(url).then((res) => res.buffer());

  fs.writeFileSync(fullPath, buffer);
  return `${coverPath}/${folder}/${fileName}.jpg`;
}

/**
 * Sanitizes a filename for safe usage.
 */
function sanitizeFilename(name) {
  return (
    name
      ?.replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "-")
      .trim() || "unknown"
  );
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
