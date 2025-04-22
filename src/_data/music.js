const fetch = require("node-fetch");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { saveTestData } = require("../js/utils/save");
const log = require("../js/utils/log");

const PLAYLISTS = {
  favourites: "79jHGYxWHmhXthpE0o8DIK",
};

const headers = {};

/**
 * Authenticates the app and sets the `Authorization` header.
 */
async function authenticateSpotify() {
  const authRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_SECRET_KEY,
    }),
  });

  const { access_token } = await authRes.json();
  headers["Authorization"] = `Bearer ${access_token}`;
}

/**
 * Fetches track data from a Spotify playlist.
 */
async function fetchPlaylistTracks(playlistId) {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`[Spotify] ❌ Failed to fetch playlist: ${playlistId}`);
  }

  return await res.json();
}

/**
 * Formats raw Spotify track data into simplified objects.
 */
function transformPlaylistItems(items) {
  return items.map((item) => {
    const track = item.track;
    return {
      id: track.id,
      name: track.name,
      image: track.album.images[0]?.url || null,
      artists: track.artists.map((a) => a.name).join(", "),
      added_at: item.added_at,
    };
  });
}

/**
 * Main entry point for module: scrapes and caches music data.
 * @returns {Promise<Object>} Scraped music data.
 */
module.exports = async function fetchSpotifyMusic() {
  const cached = getFromCache("music");
  if (cached) {
    log("[Spotify]", "🗃️ Returning cached data");
    return cached;
  }

  log("[Spotify]", "🎵 Starting fresh scrape");
  await authenticateSpotify();

  const collection = {};
  for (const [key, playlistId] of Object.entries(PLAYLISTS)) {
    log("[Spotify]", `📥 Fetching playlist: ${key}`);
    const playlistData = await fetchPlaylistTracks(playlistId);
    collection[key] = transformPlaylistItems(playlistData.items);
  }

  setIntoCache("music", collection);
  saveTestData("music.json", collection);

  log("[Spotify]", "✔️ Scraping completey");
  return collection;
};
