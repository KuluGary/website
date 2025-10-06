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
  favourites: `users/${TRAKT_USER}/favorites/movies?extended=full`,
  watchlist: `users/${TRAKT_USER}/watchlist/movies?extended=full`,
};

const OPTIONS = {
  cache: true,
  logErrors: false,
};

/**
 * Main entry point for module: fetches and caches movies data via Trakt API.
 * @returns {Promise<Object>} Fetched movies data.
 */
module.exports = async function fetchTraktMovies() {
  const cached = getFromCache("movies");
  if (cached && OPTIONS.cache) {
    log("[Trakt.tv/Shows]", "🗃️ Returning cached data");
    return cached;
  }

  time("[Trakt.tv/Shows]", "🎞️ Fetching via Trakt API");
  const collection = await getCollection();
  setIntoCache("movies", collection);
  saveTestData("movies.json", collection);
  timeEnd("[Trakt.tv/Movies]", "✅ API fetch and cache complete");

  return collection;
};

/**
 * Fetches movie collection using API
 * @returns movies collection
 */
async function getCollection() {
  const collection = {};
  for (const [status, endpoint] of Object.entries(PAGES)) {
    log("[Trakt.tv/Movies]", `🔍 Fetching ${status}`);
    try {
      const res = await fetch(`${TRAKT_API}/${endpoint}`, { headers });
      const data = await res.json();

      collection[status] = normalizeMovies(data);
    } catch (err) {
      if (OPTIONS.logErrors) console.error(`❌ Error fetching ${status}`, JSON.stringify(err));
      collection[status] = [];
    }
  }
  return collection;
}

/**
 * Normalize API movie items to a consistent structure
 * @param {Array} items Trakt API response
 */
function normalizeMovies(items) {
  return items.map((item) => {
    // Support both watchlist ({ movie }) and favorites ({ type, show|movie })
    const movie = item.movie || item.show || item;

    return {
      id: movie.ids.trakt,
      type: item.type || "movie", // fallback
      title: movie.title,
      year: movie.year,
      description: movie.overview || "",
      genres: movie.genres || [],
      link: movie.ids.slug ? `https://trakt.tv/${item.type || "movies"}/${movie.ids.slug}` : null,
      createdAt: item.listed_at || null,
      addedAt: item.listed_at || null,
    };
  });
}
