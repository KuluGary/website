const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { parseRSS } = require("../js/utils/rss");
const { saveTestData } = require("../js/utils/save");
const { log, time, timeEnd } = require("../js/utils/log");
const defaultData = require("../js//utils/_default_data/webcomics");

const PAGES = {
  reading: ["https://beyondcanon.com/story/feed?type=rss", "https://killsixbilliondemons.com/feed/"],
  favourites: [
    "https://piperka.net/s/rss/4379", // Homestuck
    "https://killsixbilliondemons.com/feed/",
  ],
  dropped: [
    "https://www.webtoons.com/en/romance/letsplay/rss?title_no=1218",
    "https://helvetica.jnwiedle.com/feed/",
    "https://www.deconreconstruction.com/vasterror/rss",
    "https://piperka.net/s/rss/7979", // 17776
    "https://www.webtoons.com/en/challenge/punderworld/rss?title_no=312584",
    "https://backcomic.com/rss.xml",
    "https://www.webtoons.com/en/slice-of-life/batman-wayne-family-adventures/rss?title_no=3180",
    "https://www.webtoons.com/en/challenge/countdown-to-countdown/rss?title_no=316884",
    "https://www.paranatural.net/comic/rss",
    "https://www.webtoons.com/en/comedy/not-so-shoujo-love-story/rss?title_no=2189",
    "https://www.starimpactcomic.com/comic/rss",
    "https://www.webtoons.com/en/challenge/nerd-and-jock/rss?title_no=135963",
  ],
  completed: [
    "https://www.neversatisfiedcomic.com/comic/rss",
    "https://piperka.net/s/rss/4379", // Homestuck
    "https://www.webtoons.com/en/supernatural/unholy-blood/rss?title_no=1262",
    "https://piperka.net/s/rss/7744", // [un]Divine
    "https://www.webtoons.com/en/comedy/axed/rss?title_no=1558",
  ],
};

const OPTIONS = {
  cache: true,
  logErrors: false,
};

function formatComicObject(comicObject) {
  const latestItem = comicObject.items[0];

  return {
    id: latestItem.id ?? latestItem.guid,
    type: "webcomics",
    title: comicObject.title,
    description: comicObject.description,
    genres: [],
    link: latestItem.link,
    addedAt: latestItem.pubDate ?? latestItem.isoDate,
    updatedAt: latestItem.pubDate ?? latestItem.isoDate,
    latestItemTitle: latestItem?.title?.trim().startsWith(comicObject.title)
      ? latestItem.title
      : comicObject.title + " - " + latestItem.title,
    author: {
      name:
        latestItem.author ??
        latestItem.creator ??
        latestItem["dc:creator"] ??
        (comicObject.copyright && removeCopyrightYear(comicObject.copyright)),
    },
  };
}

function removeCopyrightYear(str) {
  return str.replace(/©\d{4,}/g, "").trim();
}

async function getCollection() {
  const collection = {};

  for (const [status, webcomics] of Object.entries(PAGES)) {
    for (const webcomic of webcomics) {
      try {
        const json = await parseRSS(webcomic).catch((err) => OPTIONS.logErrors && console.error(err));
        const defaultValues = defaultData[webcomic];

        if (!collection[status]) collection[status] = [];

        collection[status].push({ ...formatComicObject(json), ...defaultValues });
      } catch (error) {
        if (OPTIONS.logErrors) {
          console.error(error);
        }
      }
    }
  }

  return collection;
}

module.exports = async function fetchWebcomics() {
  const cached = getFromCache("webcomics");

  if (cached && OPTIONS.cache) {
    log("[Webcomics]", "🗃️ Returning cached data");
    return cached;
  }

  time("[Webcomics]", "💬 Fetching webcomics");

  const collection = await getCollection();

  setIntoCache("webcomics", collection);
  saveTestData("webcomics.json", collection);
  timeEnd("[Webcomics]", "✔️ Fetching complete");

  return collection;
};
