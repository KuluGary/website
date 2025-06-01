const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { log } = require("../js/utils/log");
const fetch = require("node-fetch");

const OPTIONS = {
  cache: true,
};

module.exports = async function getWebmetion() {
  const cached = getFromCache("webmentions");
  if (cached && OPTIONS.cache) {
    log("[Webmentions]", "🗃️ Returning cached data");
    return cached;
  }

  const response = await fetch(
    `https://webmention.io/api/mentions.jf2?token=${process.env.WEBMENTIONS_TOKEN}&per-page=1000`
  );

  const body = await response.json();
  const webmentions = body.children;

  setIntoCache("webmentions", webmentions);

  return webmentions;
};
