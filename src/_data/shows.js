const { default: puppeteer } = require("puppeteer");
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const { log, time, timeEnd } = require("../js/utils/log");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { saveTestData } = require("../js/utils/save");
const { startProgress, incrementProgress, stopProgress } = require("../js/utils/cli-progress");
const { slugify } = require("../js/11ty/generic");
const pLimit = require("p-limit");

const TRAKT_USER = "kulugary";
const PAGES = {
  favourites: `https://trakt.tv/users/${TRAKT_USER}/favorites?display=show&sort=released%2Casc`,
  watchlist: `https://trakt.tv/users/${TRAKT_USER}/watchlist?display=show&sort=rank%2Casc`,
  // dropped: `https://trakt.tv/users/${TRAKT_USER}/lists/dropped?display=show&sort=rank%2Casc`,
  // seen: `https://trakt.tv/users/${TRAKT_USER}/lists/seen?display=show&sort=rank%2Casc`,
};
const OPTIONS = {
  cache: true,
  headless: true,
  logErrors: false,
};

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
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  const collection = {};
  for (const [status, url] of Object.entries(PAGES)) {
    log("[Trakt.tv/Shows]", `🔍 Scraping ${status}`);
    collection[status] = await scrapeShowListPage(page, url);
  }

  await browser.close();
  return collection;
}

/**
 * Scrapes a single Trakt show list page.
 * @param {puppeteer.Page} page Puppeteer page instance for a show profile.
 * @param {string} url URL of the page to go to
 */
async function scrapeShowListPage(page, url) {
  const browser = page.browser();

  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => null);

  const elements = await page.$$("#sortable-grid .grid-item, .grid .grid-item");
  if (!elements.length) return [];

  startProgress(elements.length);

  // Extract base info
  const baseShows = await Promise.all(
    elements.map(async (element) => {
      const [titleEl, linkEl] = await Promise.all([element.$(".titles h3"), element.$("a")]);
      const [title, link, originalTitle, id, date_created, date_added] = await Promise.all([
        titleEl?.evaluate((el) => el.innerText).catch(() => null),
        linkEl?.evaluate((el) => el.href).catch(() => null),
        element.evaluate((el) => el.getAttribute("data-title")),
        element.evaluate((el) => el.getAttribute("data-list-item-id")),
        element.evaluate((el) => el.getAttribute("data-released")),
        element.evaluate((el) => el.getAttribute("data-added")),
      ]);
      return { title, link, originalTitle, id, date_created, date_added };
    })
  );

  const limit = pLimit(5);

  const shows = await Promise.all(
    baseShows.map((base) =>
      limit(async () => {
        if (!base.link) return null;

        const newPage = await browser.newPage();
        await newPage.goto(base.link, { waitUntil: "domcontentloaded" });
        const { description, genres } = await scrapeShowProfilePage(newPage);
        await newPage.close();

        incrementProgress();

        return {
          id: base.id,
          type: "shows",
          title: base.title,
          description,
          genres,
          link: base.link,
          createdAt: base.date_created,
          addedAt: base.date_added,
        };
      })
    )
  );

  stopProgress();
  return shows.filter(Boolean);
}

/**
 * Extracts the description and genres for a show
 * @param {puppeteer.Page} page Puppeteer page instance for a show profile.
 * @returns {Promise<{ description: string, genres: Array<string>, imageSrc: string }>} Object containing the description and genres of a show
 */
async function scrapeShowProfilePage(page) {
  const description = await page.$eval("#tagline + #overview", (el) => el.innerText).catch(() => null);

  const genres = await page.evaluate(() =>
    Array.from(document.querySelectorAll("span[itemprop='genre']")).map((el) => el.innerText.trim())
  );

  return { description, genres };
}
