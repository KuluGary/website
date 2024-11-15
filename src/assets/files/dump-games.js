const { default: puppeteer } = require("puppeteer");
const fs = require("fs");

const HLTB_USER = "";
const JSON_DUMP_PATH = "";

const PAGES = {
  playing: `https://howlongtobeat.com/user/${HLTB_USER}/games/playing/1`,
  backlog: `https://howlongtobeat.com/user/${HLTB_USER}/games/backlog/1`,
  custom: `https://howlongtobeat.com/user/${HLTB_USER}/games/custom/1`,
  completed: `https://howlongtobeat.com/user/${HLTB_USER}/games/completed/1`,
  retired: `https://howlongtobeat.com/user/${HLTB_USER}/games/retired/1`,
};

/**
 * Uses puppeteer to web-scrap games from How Long To Beat
 */
async function main() {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  const dump = {};

  console.log("Scraping ... ... ...");

  for (const [status, pagePath] of Object.entries(PAGES)) {
    dump[status] = [];

    await page.goto(pagePath);

    try {
      const rejectionModal = await page.waitForSelector(
        "#onetrust-reject-all-handler",
        { timeout: 1000 }
      );
      if (rejectionModal) await page.click("#onetrust-reject-all-handler");
    } catch (error) {}

    await delay(1000);
    await page.waitForSelector("[aria-label='View Options']");
    await page.click("[aria-label='View Options']");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await delay(1500);

    await page.waitForSelector("#user_games");

    const rows = await page.$$(
      "#user_games > div > div > div > div:not(:first-of-type)"
    );

    for (const row of rows) {
      const titleSelector = await row.waitForSelector("a");
      const title = await titleSelector?.evaluate((el) => el.innerText);
      const link = await titleSelector?.evaluate((el) => el.href);

      const platformSelector = await row.waitForSelector("span");
      const platform = await platformSelector?.evaluate((el) => el.innerText);

      const imageSelector = await row.waitForSelector("img");
      const image = await imageSelector?.evaluate((el) => el.src);

      page.click(`a[title="${title}"]`, { button: "middle" });
      await delay(2000);

      const allPages = await browser.pages();
      const currentPage = allPages[allPages.length - 1];

      await currentPage.bringToFront();

      try {
        const descriptionSelector = await currentPage.waitForSelector(
          ".GameSummary_profile_info__HZFQu",
          {
            timeout: 6000,
          }
        );

        const readMoreSelector = await descriptionSelector
          .waitForSelector("#profile_summary_more", { timeout: 2000 })
          .catch(() => null);

        if (readMoreSelector) {
          await readMoreSelector.click();
          await readMoreSelector.evaluate((el) => el.remove());
        }

        const description = await descriptionSelector
          ?.evaluate((el) => el.innerText)
          .catch(() => null);

        await currentPage.close();

        const game = { title, link, platform, image, description };

        dump[status].push(game);
      } catch (error) {
        continue;
      }
    }
  }

  browser.close();

  fs.writeFileSync(JSON_DUMP_PATH, JSON.stringify(dump));
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

main();
