const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { log, timeEnd, time } = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");
const { parseXML } = require("../js/utils/xml");

const OPTIONS = {
  cache: false,
};

const FEED_URL = "https://status.cafe/users/kulugary.atom";

module.exports = async function fetchStatus() {
  const cached = getFromCache("status");

  if (cached && OPTIONS.cache) {
    log("[status.cafe]", "😀 Returning cached data");
    return cached;
  }

  time("[status.cafe]", "😀 Fetching status");
  const feed = await getFeed();
  setIntoCache("status", feed);
  saveTestData("status.json", feed);
  timeEnd("[status.cafe]", "✔️ Fetching complete");

  return feed;
};

async function getFeed() {
  return await fetch(FEED_URL)
    .then((response) => response.text())
    .then(parseXML)
    .then((res) => ({
      ...res.feed,
      entry: res.feed.entry.map((entry) => ({
        ...entry,
        emoji: entry.title.match(/(\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g),
      })),
    }));
}
