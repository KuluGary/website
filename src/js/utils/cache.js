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

function getTTL(daysToAdd = 1) {
  const nowInSeconds = Math.floor(Date.now() / 1000); // current time in seconds
  const secondsInDay = 86400; // number of seconds in a day
  return nowInSeconds + daysToAdd * secondsInDay; // add the specified days to the current time
}

module.exports = {
  getFromCache,
  setIntoCache,
};
