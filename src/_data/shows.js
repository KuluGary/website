const { default: puppeteer } = require("puppeteer");
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const { log, time, timeEnd } = require("../js/utils/log");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { saveTestData } = require("../js/utils/save");
const delay = require("../js/utils/delay");
const { startProgress, incrementProgress, stopProgress } = require("../js/utils/cli-progress");
const { slugify } = require("../js/11ty/generic");

const TRAKT_USER = "kulugary";
const PAGES = {
  favourites: `https://trakt.tv/users/${TRAKT_USER}/favorites?display=show&sort=released%2Casc`,
  dropped: `https://trakt.tv/users/${TRAKT_USER}/lists/dropped?display=show&sort=rank%2Casc`,
  watchlist: `https://trakt.tv/users/${TRAKT_USER}/watchlist?display=show&sort=rank%2Casc`,
  seen: `https://trakt.tv/users/${TRAKT_USER}/lists/seen?display=show&sort=rank%2Casc`,
};
const OPTIONS = {
  cache: true,
  headless: true,
};

const coverPath = "/assets/images/covers/shows";

/**
 * Main entry point for module: scrapes and caches shows data.
 * @returns {Promise<Object>} Scraped shows data.
 */
module.exports = async function fetchTraktShows() {
  const cached = getFromCache("shows");
  if (cached && OPTIONS.cache) {
    log("[Trakt.tv/Shows]", "🗃️ Returning cached data");
    return cached;
  }

  time("[Trakt.tv/Shows]", "🎞️ Starting fresh scrape");
  const collection = await getCollection();
  setIntoCache("shows", collection);
  saveTestData("shows.json", collection);
  timeEnd("[Trakt.tv/Shows]", "✅ Scraped and cached show data");

  return collection;
};

/**
 * Fetches show collection
 * @returns shows collection
 */
async function getCollection() {
  const browser = await puppeteer.launch({
    headless: OPTIONS.headless,
    args: [
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "--disable-features=site-per-process",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  const collection = {};
  for (const [status, url] of Object.entries(PAGES)) {
    log("[Trakt.tv/Shows]", `🔍 Scraping ${status}`);
    collection[status] = await scrapeShowListPage(page, url, status);
  }

  await browser.close();
  return collection;
}

/**
 * Constructs Trakt URL by status and type
 * @param {string} status
 * @param {string} type
 */
function constructShowUrl(status, type) {
  return `https://trakt.tv/users/${TRAKT_USER}/${status}?display=${type}&sort=released%2Casc`;
}

/**
 * Scrapes a single Trakt show list page.
 * @param {puppeteer.Page} page Puppeteer page instance for a show profile.
 * @param {string} url URL of the page to go to
 * @param {string} status status type of the show to fetch
 */
async function scrapeShowListPage(page, url, status) {
  const browser = page.browser();

  await page.goto(url).catch(() => null);
  await page.waitForSelector("#sortable-grid").catch(() => null);

  const shows = [];
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
      const { description, genres, imageSrc } = await scrapeShowProfilePage(profilePage);
      await profilePage.close();

      const safeName = slugify(originalTitle);
      const imagePath = await downloadImage(status, imageSrc, safeName);

      shows.push({
        id,
        type: "shows",
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
      log("[Trakt.tv/Shows]", `⚠️ Skipped one element in ${status}: ${err.message}`);
    }
  }

  stopProgress();

  return shows;
}

/**
 * Extracts the description and genres for a show
 * @param {puppeteer.Page} page Puppeteer page instance for a show profile.
 * @returns {Promise<{ description: string, genres: Array<string>, imageSrc: string }>} Object containing the description and genres of a show
 */
async function scrapeShowProfilePage(page) {
  await delay(1000);
  const descriptionSelector = await page.waitForSelector("#tagline + #overview");
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
