const puppeteer = require("puppeteer");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { log, time, timeEnd } = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");
const fetch = require("node-fetch");
const delay = require("../js/utils/delay");
const { startProgress, incrementProgress, stopProgress } = require("../js/utils/cli-progress");

const DEBUG = false;
const HLTB_USER = "KuluGary";
const PAGES = {
  playing: `https://howlongtobeat.com/user/${HLTB_USER}/games/playing/1`,
  backlog: `https://howlongtobeat.com/user/${HLTB_USER}/games/backlog/1`,
  favourites: `https://howlongtobeat.com/user/${HLTB_USER}/games/custom/1`,
  played: `https://howlongtobeat.com/user/${HLTB_USER}/games/custom2/1`,
  completed: `https://howlongtobeat.com/user/${HLTB_USER}/games/completed/1`,
  retired: `https://howlongtobeat.com/user/${HLTB_USER}/games/retired/1`,
};

/**
 * Extracts the genres and description from the game's profile page.
 * @param {puppeteer.Page} page - Puppeteer page instance for a game profile.
 * @returns {Promise<{ id: string, description: string, genres: Array<string>, developer: string }>} Object containing description and genres.
 */
async function scrapeGameFromProfile(page) {
  try {
    const url = page.url();
    const id = url.split("/").at(-1);
    const descriptionSelector = await page.waitForSelector(".GameSummary_profile_info__HZFQu", { timeout: 6000 });
    const readMore = await descriptionSelector
      .waitForSelector("#profile_summary_more", { timeout: 2000 })
      .catch(() => null);

    if (readMore) {
      await readMore.click();
      await readMore.evaluate((el) => el.remove());
    }

    const imageSelector = await page.waitForSelector(`.GameSideBar_game_image__ozUTt > img:nth-child(1)`, {
      timeout: 2000,
    });
    const image = await imageSelector.evaluate((el) => el.getAttribute("src"));

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

    const developer = await page.evaluate(() => {
      const label = Array.from(document.querySelectorAll("div > strong")).find(
        (div) => div.textContent.trim() === "Developer:" || div.textContent.trim() === "Developers:"
      );
      if (!label) return;

      const container = label.parentElement;
      label.remove();
      container.querySelector("br")?.remove();

      return container.innerText;
    });

    return { id, description, genres, image, developer };
  } catch (error) {
    log("[HLTB]", "⚠️ Error scraping game profile");
    return { id: null, description: null, genres: [] };
  }
}

/**
 * Scrapes basic game info from the list view.
 * @param {puppeteer.ElementHandle} game - DOM element for a single game entry.
 * @returns {Promise<{ title: string, link: string, platform: string, image: string, playtime: number, rate: string }>} Game metadata.
 */
async function scrapeGameFromList(game) {
  const title = await game.$eval("a", (el) => el.innerText);
  const link = await game.$eval("a", (el) => el.href);
  const platform = await game.$eval("span", (el) => el.innerText);
  const playtime = await game.$eval("div > div:nth-child(2)", (el) => {
    const timeString = el.innerText;
    if (!timeString) return undefined;

    const [primaryPart] = timeString.split("/").map((part) => part.trim());

    if (primaryPart === "--") return undefined;

    const hoursMatch = primaryPart.match(/(\d+)h/);
    const minutesMatch = primaryPart.match(/(\d+)m/);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    return hours * 60 + minutes;
  });

  const rate = await game.$eval("div > div:nth-child(3)", (el) => {
    if (el.innerText === "NR") return;

    return el.innerText;
  });

  return { title, link, platform, playtime, rate };
}

async function extractCookies(page) {
  const client = await page.target().createCDPSession();
  const cookies = (await client.send("Network.getAllCookies")).cookies;
  await delay(1000);
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  return cookieHeader;
}

/**
 * Fetch extended game metadata directly from the HLTB API.
 * @returns {Promise<Object[]>}
 */
async function fetchExtendedGameData(list, cookies) {
  const userId = 525327;

  const getListNameId = (list) => {
    if (list === "favourites") return "custom";
    if (list === "played") return "custom2";
    return list;
  };

  const body = {
    user_id: userId,
    toggleType: "Single List",
    lists: [getListNameId(list)],
    set_playstyle: "comp_all",
    name: "",
    platform: "",
    storefront: "",
    sortBy: "",
    sortFlip: 0,
    view: "list",
    random: 0,
    limit: 500,
    currentUserHome: false,
  };

  const response = await fetch(`https://howlongtobeat.com/api/user/${userId}/games/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: `https://howlongtobeat.com/user/KuluGary/games/playing/1`,
      Origin: "https://howlongtobeat.com",
      DNT: "1",
      Connection: "keep-alive",
      Cookie: cookies,
    },
    body: JSON.stringify(body),
  }).catch((err) => DEBUG && console.error(err));

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch extended game data: ${response.status}\n${text}`);
  }

  const { data } = await response.json();
  return data.gamesList;
}

/**
 * Handles scraping of all games on a user's status page.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} url - The URL of the user's game status page.
 * @returns {Promise<Object[]>} Array of game objects.
 */
async function scrapeGamesFromPage(page, url, status) {
  const browser = page.browser();

  await page.goto(url).catch(() => null);
  await delay(1000);

  const acceptCookies = await page.waitForSelector("#onetrust-accept-btn-handler", { timeout: 1000 }).catch(() => null);
  if (acceptCookies) await acceptCookies.click();

  await page.waitForSelector("#user_games");
  const gameElements = await page.$$("#user_games > div > div > div > div:not(:first-of-type)");
  startProgress(gameElements.length);

  const games = [];
  const cookies = await extractCookies(page);
  const extendedListInfo = await fetchExtendedGameData(status, cookies);

  for (const game of gameElements) {
    const { link, platform, title, playtime, rate } = await scrapeGameFromList(game);
    const newPage = await browser.newPage();
    await newPage.goto(link).catch(() => null);
    await delay(2000);

    const pages = await browser.pages();
    const profilePage = pages[pages.length - 1];

    await profilePage.bringToFront();
    const { description, genres, id, image, developer } = await scrapeGameFromProfile(profilePage);
    await profilePage.close();

    const extendedInfo = extendedListInfo.find((extendedGame) => id == String(extendedGame.game_id));

    games.push({
      id,
      type: "Game",
      title,
      description,
      genres,
      platform,
      link,
      thumbnail: image,
      updatedAt: extendedInfo?.date_updated,
      addedAt: extendedInfo?.date_added,
      startedAt: extendedInfo?.date_start,
      completedAt: extendedInfo?.date_complete,
      playtime,
      rate,
      author: { name: developer },
    });
    incrementProgress();
  }

  stopProgress();

  return games;
}

/**
 * Orchestrates scraping across all status categories.
 * @returns {Promise<Object>} Collection of games grouped by status.
 */
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
    log("[HLTB]", `🔍 Scraping ${status}`);
    collection[status] = await scrapeGamesFromPage(page, url, status);
  }

  await browser.close();
  return collection;
}

/**
 * Main entry point for module: scrapes and caches game data.
 * @returns {Promise<Object>} Scraped game data.
 */
module.exports = async function fetchHLTBGames() {
  const cached = getFromCache("games");

  if (cached && !DEBUG) {
    log("[HLTB]", "🗃️ Returning cached data");
    return cached;
  }

  time("[HLTB]", "🎮 Starting fresh scrape");
  const collection = await getCollection();
  setIntoCache("games", collection);
  saveTestData("games.json", collection);
  timeEnd("[HLTB]", "✔️ Scraping complete");

  return collection;
};
