const puppeteer = require("puppeteer");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { log, time, timeEnd } = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");
const fetch = require("node-fetch");
const delay = require("../js/utils/delay");
const { startProgress, incrementProgress, stopProgress } = require("../js/utils/cli-progress");
const pLimit = require("p-limit");

const HLTB_USER = "KuluGary";
const PAGES = {
  playing: `https://howlongtobeat.com/user/${HLTB_USER}/games/playing/1`,
  backlog: `https://howlongtobeat.com/user/${HLTB_USER}/games/backlog/1`,
  favourites: `https://howlongtobeat.com/user/${HLTB_USER}/games/custom/1`,
  played: `https://howlongtobeat.com/user/${HLTB_USER}/games/custom2/1`,
  completed: `https://howlongtobeat.com/user/${HLTB_USER}/games/completed/1`,
  retired: `https://howlongtobeat.com/user/${HLTB_USER}/games/retired/1`,
};
const OPTIONS = {
  cache: false,
  headless: true,
  logErrors: false,
};

/**
 * Main entry point for module: scrapes and caches game data.
 * @returns {Promise<Object>} Scraped game data.
 */
module.exports = async function fetchHLTBGames() {
  const cached = getFromCache("games");

  if (cached && OPTIONS.cache) {
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

/**
 * Extracts the genres and description from the game's profile page.
 * @param {puppeteer.Page} page - Puppeteer page instance for a game profile.
 * @returns {Promise<{ id: string, description: string, genres: Array<string>, developer: string }>} Object containing description and genres.
 */
async function scrapeGameFromProfile(page) {
  try {
    const url = page.url();
    const id = url.split("/").at(-1);

    await page.waitForSelector(".GameSummary_profile_info__HZFQu", {
      timeout: 10000, // allow slower loads
    });

    // Expand "Read More" if present
    if (await page.$("#profile_summary_more")) {
      await page.click("#profile_summary_more").catch(() => null);

      // Instead of waiting for the button to disappear, wait for description to grow
      await page
        .waitForFunction(
          () => {
            const el = document.querySelector(".GameSummary_profile_info__HZFQu");
            return el && el.innerText.length > 200; // assume expanded text is longer
          },
          { timeout: 5000 }
        )
        .catch(() => null); // if timeout, continue anyway
    }

    // Extract in one go
    const { description, genres, developer } = await page.evaluate(() => {
      const descriptionEl = document.querySelector(".GameSummary_profile_info__HZFQu");
      const description = descriptionEl ? descriptionEl.innerText.trim() : null;

      let genres = [];
      const genreLabel = Array.from(document.querySelectorAll("div > strong")).find((el) =>
        ["Genres:", "Genre:"].includes(el.textContent.trim())
      );
      if (genreLabel) {
        const container = genreLabel.parentElement;
        genres = container.innerText
          .replace("Genres:", "")
          .replace("Genre:", "")
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean);
      }

      let developer = null;
      const devLabel = Array.from(document.querySelectorAll("div > strong")).find((el) =>
        ["Developer:", "Developers:"].includes(el.textContent.trim())
      );
      if (devLabel) {
        const container = devLabel.parentElement;
        developer = container.innerText.replace("Developer:", "").replace("Developers:", "").trim();
      }

      return { description, genres, developer };
    });

    return { id, description, genres, developer };
  } catch (error) {
    log("[HLTB]", "⚠️ Error scraping game profile", error);
    return { id: null, description: null, genres: [], image: null, developer: null };
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

/**
 * Extracts cookies from HTTP request
 * @param {puppeteer.Page} page - Puppeteer page instance
 * @returns HTTP request cookies
 */
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
  }).catch((err) => OPTIONS.logErrors && console.error(err));

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

  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => null);

  const acceptCookies = await page.waitForSelector("#onetrust-accept-btn-handler", { timeout: 1500 }).catch(() => null);
  if (acceptCookies) await acceptCookies.click();

  await page.waitForSelector("#user_games");
  const gameElements = await page.$$("#user_games > div > div > div > div:not(:first-of-type)");
  startProgress(gameElements.length);

  const cookies = await extractCookies(page);

  const extendedListInfo = await fetchExtendedGameData(status, cookies);

  const baseGames = await Promise.all(gameElements.map((game) => scrapeGameFromList(game)));

  const limit = pLimit(5);

  const games = await Promise.all(
    baseGames.map((base) =>
      limit(async () => {
        const extendedInfo = extendedListInfo.find(
          (ext) => String(ext.game_id) === String(base.link.split("/").at(-1))
        );

        let description = extendedInfo?.profile_summary;
        let genres = extendedInfo?.profile_genres || [];
        let developer = extendedInfo?.profile_developer;

        if (!description || !genres.length || !developer) {
          const newPage = await browser.newPage();
          await newPage.goto(base.link, { waitUntil: "domcontentloaded" });
          const profileData = await scrapeGameFromProfile(newPage);
          await newPage.close();

          description = description || profileData.description;
          genres = genres.length ? genres : profileData.genres;
          developer = developer || profileData.developer;
        }

        incrementProgress();

        return {
          id: extendedInfo?.game_id || base.link.split("/").at(-1),
          type: "games",
          title: base.title,
          description,
          genres,
          platform: base.platform,
          link: base.link,
          updatedAt: extendedInfo?.date_updated,
          addedAt: extendedInfo?.date_added,
          startedAt: extendedInfo?.date_start,
          completedAt: extendedInfo?.date_complete,
          playtime: base.playtime,
          rate: base.rate,
          author: { name: developer },
        };
      })
    )
  );

  stopProgress();

  return games;
}

/**
 * Orchestrates scraping across all status categories.
 * @returns {Promise<Object>} Collection of games grouped by status.
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
    log("[HLTB]", `🔍 Scraping ${status}`);
    collection[status] = await scrapeGamesFromPage(page, url, status);
  }

  await browser.close();
  return collection;
}
