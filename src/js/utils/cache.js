const { FlatCache } = require("flat-cache");

let cache;
const cacheId = "cache1";

function _initializeCache() {
  if (!cache) {
    cache = new FlatCache();
  }
  cache.load(cacheId);
}

/**
 * Returns an object from cache by the key
 * @param {string} cacheKey key of the cache object to obtain
 * @returns the requested object saved into cache
 */
function getFromCache(cacheKey) {
  if (!cache) _initializeCache();
  const cachedItem = cache.getKey(cacheKey);
  if (cachedItem?.data) {
    const ttl = Math.floor(cachedItem.ttl - Date.now() / 1000);

    if (ttl > 0) {
      return cachedItem.data;
    }
  }
  return;
}

/**
 * Persist data into cache by key
 * @param {string} cacheKey key of the cache object to persist
 * @param {any} cacheData data to persist into cache storage
 * @param {number} daysToAdd customizable TTL
 */
function setIntoCache(cacheKey, cacheData, daysToAdd) {
  if (!cache) _initializeCache();

  cache.setKey(cacheKey, {
    ttl: getTTL(daysToAdd),
    data: cacheData,
  });

  cache.save();
}

/**
 * Removes an object from cache by its key
 * @param {string} cacheKey key of the object to remove from cache
 */
function removeFromCache(cacheKey) {
  if (!cache) return;

  cache.removeKey(cacheKey);
}

function getTTL(daysToAdd = 7) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const secondsInDay = 86400;
  return nowInSeconds + daysToAdd * secondsInDay;
}

module.exports = {
  getFromCache,
  setIntoCache,
  removeFromCache,
};
