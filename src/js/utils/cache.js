const { FlatCache } = require("flat-cache");

let cache;
const cacheId = "cache1";

function _initializeCache() {
  if (!cache) {
    cache = new FlatCache();
  }
  cache.load(cacheId);
}

function getFromCache(cacheKey) {
  _initializeCache();

  const cachedItem = cache.getKey(cacheKey);
  if (cachedItem) {
    const ttl = Math.floor(cachedItem.ttl - Date.now() / 1000);

    if (ttl > 0) {
      return cachedItem.data;
    }
  }
  return;
}

function setIntoCache(cacheKey, cacheData, daysToAdd) {
  if (!cache) _initializeCache();

  cache.setKey(cacheKey, {
    ttl: getTTL(daysToAdd),
    data: cacheData,
  });

  cache.save();
}

function getTTL(daysToAdd = 7) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const secondsInDay = 86400;
  return nowInSeconds + daysToAdd * secondsInDay;
}

module.exports = {
  getFromCache,
  setIntoCache,
};
