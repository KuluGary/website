const { FlatCache } = require("flat-cache");

let cache;

function getFromCache(cacheKey) {
  if (!cache) {
    cache = new FlatCache();
  }
  cache.load("cache1");

  const cachedItem = cache.getKey(cacheKey);
  if (cachedItem) {
    const ttl = Math.floor(cachedItem.ttl - Date.now() / 1000);

    if (ttl > 0) {
      return cachedItem.data;
    }
  }
  return;
}

function setIntoCache(cacheKey, cacheData) {
  cache.setKey(cacheKey, {
    ttl: Math.floor(Date.now() / 1000 + 86400),
    data: cacheData,
  });

  cache.save();
}

module.exports = {
  getFromCache,
  setIntoCache,
};
