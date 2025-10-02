const fetch = require("node-fetch");

const { log, time, timeEnd } = require("../js/utils/log");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { saveTestData } = require("../js/utils/save");

const TRAKT_USER = "kulugary";
const TRAKT_API = "https://api.trakt.tv";

const CLIENT_ID = process.env.TRAKT_CLIENT_ID;

if (!CLIENT_ID) {
  throw new Error("Missing TRAKT_CLIENT_ID env variable. Get one at https://trakt.tv/oauth/applications");
}

const headers = {
  "Content-Type": "application/json",
  "trakt-api-version": "2",
  "trakt-api-key": CLIENT_ID,
};

const PAGES = {
  favourites: `users/${TRAKT_USER}/favorites/shows?extended=full`,
  watchlist: `users/${TRAKT_USER}/watchlist/shows?extended=full`,
};

const OPTIONS = {
  cache: true,
  logErrors: true,
};

/**
 * Main entry point for module: fetches and caches shows data via Trakt API.
 * @returns {Promise<Object>} Fetched shows data.
 */
module.exports = async function fetchTraktShows() {
  const cached = getFromCache("shows");
  if (cached && OPTIONS.cache) {
    log("[Trakt.tv/Shows]", "🗃️ Returning cached data");
    return cached;
  }

  time("[Trakt.tv/Shows]", "🎞️ Fetching via Trakt API");
  const collection = await getCollection();
  setIntoCache("shows", collection);
  saveTestData("shows.json", collection);
  timeEnd("[Trakt.tv/Shows]", "✅ API fetch and cache complete");

  return collection;
};

/**
 * Fetches show collection using API
 * @returns shows collection
 */
async function getCollection() {
  const collection = {};
  for (const [status, endpoint] of Object.entries(PAGES)) {
    log("[Trakt.tv/Shows]", `🔍 Fetching ${status}`);
    try {
      const res = await fetch(`${TRAKT_API}/${endpoint}`, { headers });
      const data = await res.json();

      collection[status] = normalizeShows(data);
    } catch (err) {
      if (OPTIONS.logErrors) console.error(`❌ Error fetching ${status}`, JSON.stringify(err));
      collection[status] = [];
    }
  }
  return collection;
}

/**
 * Normalize API show items to a consistent structure
 * @param {Array} items Trakt API response
 */
function normalizeShows(items) {
  return items.map((item) => {
    // Support both watchlist ({ show }) and favorites ({ type, show|movie })
    const show = item.show || item.movie || item;

    return {
      id: show.ids.trakt,
      type: item.type || "show", // fallback
      title: show.title,
      year: show.year,
      description: show.overview || "",
      genres: show.genres || [],
      link: show.ids.slug ? `https://trakt.tv/${item.type || "shows"}/${show.ids.slug}` : null,
      createdAt: item.listed_at || null,
      addedAt: item.listed_at || null,
    };
  });
}
