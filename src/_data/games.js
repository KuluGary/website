const puppeteer = require("puppeteer");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const log = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");

const HLTB_USER = "KuluGary";
const PAGES = {
  playing: `https://howlongtobeat.com/user/${HLTB_USER}/games/playing/1`,
  backlog: `https://howlongtobeat.com/user/${HLTB_USER}/games/backlog/1`,
  custom: `https://howlongtobeat.com/user/${HLTB_USER}/games/custom/1`,
  completed: `https://howlongtobeat.com/user/${HLTB_USER}/games/completed/1`,
  retired: `https://howlongtobeat.com/user/${HLTB_USER}/games/retired/1`,
};

/**
 * Delay helper for controlled navigation.
 * @param {number} time - Time to wait in milliseconds.
 * @returns {Promise<void>}
 */
const delay = (time) => new Promise((res) => setTimeout(res, time));

/**
 * Extracts the genres and description from the game's profile page.
 * @param {puppeteer.Page} page - Puppeteer page instance for a game profile.
 * @returns {Promise<Object>} Object containing description and genres.
 */
async function scrapeGameFromProfile(page) {
  try {
    const descriptionSelector = await page.waitForSelector(".GameSummary_profile_info__HZFQu", { timeout: 6000 });
    const readMore = await descriptionSelector
      .waitForSelector("#profile_summary_more", { timeout: 2000 })
      .catch(() => null);

    if (readMore) {
      await readMore.click();
      await readMore.evaluate((el) => el.remove());
    }

    const description = await descriptionSelector.evaluate((el) => el.innerText);

    const genres = await page.evaluate(() => {
      const label = Array.from(document.querySelectorAll("div > strong")).find(
        (div) => div.textContent.trim() === "Genres:"
      );
      if (!label) return [];

      const container = label.parentElement;
      label.remove();
      container.querySelector("br")?.remove();

      return container.innerText.split(",").map((g) => g.trim());
    });

    return { description, genres };
  } catch (error) {
    log("[HLTB]", "⚠️ Error scraping game profile");
    return { description: null, genres: [] };
  }
}

/**
 * Scrapes basic game info from the list view.
 * @param {puppeteer.ElementHandle} game - DOM element for a single game entry.
 * @returns {Promise<Object>} Game metadata.
 */
async function scrapeGameFromList(game) {
  const title = await game.$eval("a", (el) => el.innerText);
  const link = await game.$eval("a", (el) => el.href);
  const platform = await game.$eval("span", (el) => el.innerText);
  const image = await game.$eval("img", (el) => el.src);
  return { title, link, platform, image };
}

/**
 * Handles scraping of all games on a user's status page.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} url - The URL of the user's game status page.
 * @returns {Promise<Object[]>} Array of game objects.
 */
async function scrapeGamesFromPage(page, url) {
  await page.goto(url);
  await delay(1000);

  const acceptCookies = await page.waitForSelector("#onetrust-accept-btn-handler", { timeout: 1000 }).catch(() => null);
  if (acceptCookies) await acceptCookies.click();

  await page.click("[aria-label='View Options']");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await delay(1000);

  await page.waitForSelector("#user_games");
  const gameElements = await page.$$("#user_games > div > div > div > div:not(:first-of-type)");

  const games = [];

  for (const game of gameElements) {
    const basicInfo = await scrapeGameFromList(game);
    await page.click(`a[title="${basicInfo.title}"]`, { button: "middle" });
    await delay(2000);

    const pages = await page.browser().pages();
    const profilePage = pages[pages.length - 1];

    await profilePage.bringToFront();
    const profileInfo = await scrapeGameFromProfile(profilePage);
    await profilePage.close();

    games.push({ ...basicInfo, ...profileInfo });
  }

  return games;
}

/**
 * Orchestrates scraping across all status categories.
 * @returns {Promise<Object>} Collection of games grouped by status.
 */
async function getCollection() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  const allGames = {};
  for (const [status, url] of Object.entries(PAGES)) {
    log("[HLTB]", `🔍 Scraping ${status}`);
    allGames[status] = await scrapeGamesFromPage(page, url);
  }

  await browser.close();
  return allGames;
}

/**
 * Main entry point for module: scrapes and caches game data.
 * @returns {Promise<Object>} Scraped game data.
 */
module.exports = async function fetchHLTBGames() {
  const cached = getFromCache("games");
  if (cached) {
    log("[HLTB]", "🗃️ Returning cached data");
    return cached;
  }

  log("[HLTB]", "🎮 Starting fresh scrape");
  const data = await getCollection();
  setIntoCache("games", data);
  saveTestData("games.json", data);
  log("[HLTB]", "✔️ Scraping complete");

  return data;
};
