const { default: puppeteer } = require("puppeteer");
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { log, time, timeEnd } = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");
const delay = require("../js/utils/delay");
const { startProgress, incrementProgress, stopProgress } = require("../js/utils/cli-progress");
const { slugify } = require("../js/11ty/generic");

const DEBUG = false;
const TRAKT_USER = "kulugary";
const PAGES = {
  favourites: `https://trakt.tv/users/${TRAKT_USER}/favorites?display=movie&sort=released%2Casc`,
  dropped: `https://trakt.tv/users/${TRAKT_USER}/lists/dropped?display=movie&sort=rank%2Casc`,
  watchlist: `https://trakt.tv/users/${TRAKT_USER}/watchlist?display=movie&sort=rank%2Casc`,
  seen: `https://trakt.tv/users/${TRAKT_USER}/lists/seen?display=movie&sort=rank%2Casc`,
};

const coverPath = "/assets/images/covers/movies";

/**
 * Scrapes a single Trakt page for movie entries.
 */
async function scrapeMoviePage(page, url, status) {
  const browser = page.browser();

  await page.goto(url).catch(() => null);
  await page.waitForSelector("#sortable-grid").catch(() => null);

  const movies = [];
  const elements = await page.$$("#sortable-grid .grid-item").catch(() => null);
  startProgress(elements.length);

  for (const element of elements) {
    try {
      const [titleEl, linkEl] = await Promise.all([element.$(".titles h3"), element.$("a")]);

      const [title, link, originalTitle, id, date_created, date_added] = await Promise.all([
        titleEl.evaluate((el) => el.innerText),
        linkEl.evaluate((el) => el.href),
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
      const { description, genres, imageSrc } = await scrapeMovieProfile(profilePage);
      await profilePage.close();

      const safeName = slugify(originalTitle);
      const imagePath = await downloadImage(status, imageSrc, safeName);

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
      incrementProgress();
    } catch (err) {
      log("[Trakt.tv/Movies]", `⚠️ Skipped one element in ${status}: ${err.message}`);
    }
  }

  stopProgress();

  return movies;
}

/**
 * Extracts the description and genres for a movie
 * @param {puppeteer.Page} page Puppeteer page instance for a movie profile.
 * @returns {Promise<{ description: string, genres: Array<string>, imageSrc: string }>} Object containing the description and genres of a movie
 */
async function scrapeMovieProfile(page) {
  await delay(1000);
  const descriptionSelector = await page.waitForSelector("#overview");
  const description = await descriptionSelector.evaluate((el) => el.innerText);

  const imageSelector = await page.waitForSelector("img.real");
  const imageSrc = await imageSelector.evaluate((el) => el.src);

  const genres = await page.evaluate(() => {
    const genreSelector = Array.from(document.querySelectorAll("span[itemprop='genre']"));

    if (!genreSelector) return [];

    return genreSelector.map((genreElement) => genreElement.innerText.trim());
  });

  return { description, genres, imageSrc };
}

/**
 * Downloads and saves an image locally.
 */
async function downloadImage(folder, url, fileName) {
  const dir = path.join("src/" + coverPath, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fullPath = path.join(dir, `${fileName}.jpg`);
  const buffer = await fetch(url).then((res) => res.buffer());

  if (!fs.existsSync(fullPath)) fs.writeFileSync(fullPath, buffer);
  return `${coverPath}/${folder}/${fileName}.jpg`;
}

async function getCollection() {
  const browser = await puppeteer.launch({
    headless: !DEBUG,
    args: [
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "--disable-features=site-per-process",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  const collection = {};
  for (const [status, url] of Object.entries(PAGES)) {
    log("[Trakt.tv/Movies]", `🔍 Scraping ${status}`);
    collection[status] = await scrapeMoviePage(page, url, status);
  }

  await browser.close();
  return collection;
}

/**
 * Main entry point for module: scrapes and caches movies data.
 * @returns {Promise<Object>} Scraped movies data.
 */
module.exports = async function fetchTraktMovies() {
  const cached = getFromCache("movies");
  if (cached && !DEBUG) {
    log("[Trakt.tv/Movies]", "🗃️ Returning cached data");
    return cached;
  }

  time("[Trakt.tv/Movies]", "🎞️ Starting fresh scrape");
  const collection = await getCollection();
  setIntoCache("movies", collection);
  saveTestData("movies.json", collection);
  timeEnd("[Trakt.tv/Movies]", "✔️ Scraping complete");

  return collection;
};
