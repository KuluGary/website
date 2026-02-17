import { getFromCache, setIntoCache } from "../js/cache.js";
import { parseXML } from "../js/lib/xml.js";

const FEED_URL = "https://status.cafe/users/kulugary.atom";

export default async function () {
  const cached = getFromCache("status");

  if (cached) return cached;

  const feed = await fetch(FEED_URL)
    .then((response) => response.text())
    .then(parseXML)
    .then((res) => ({
      ...res.feed,
      entry: res.feed.entry.map((entry) => ({
        ...entry,
        title: decodeNumericEntities(entry.title.replace("kulugary", "").trim()),
      })),
    }));

  setIntoCache("status", feed);

  return feed;
}

function decodeNumericEntities(str) {
  return str.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(num));
}
