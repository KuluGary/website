const fetch = require("node-fetch");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { saveTestData } = require("../js/utils/save");
const { log, time, timeEnd } = require("../js/utils/log");

const PLAYLISTS = {
  favourites: "79jHGYxWHmhXthpE0o8DIK",
};
const OPTIONS = {
  cache: true,
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
async function transformPlaylistItems(items) {
  const playlist = [];

  for (const item of items) {
    const track = item.track;
    const genres = [];

    for (const artist of track.artists) {
      const artistGenres = await getArtistGenres(artist.id);
      genres.push(...artistGenres);
    }

    playlist.push({
      id: track.id,
      type: "music",
      title: track.name,
      thumbnail: track.album.images[0]?.url || null,
      author: {
        name: track.artists.map((a) => a.name).join(", "),
      },
      genres,
      addedAt: item.added_at,
    });
  }

  return playlist;
}

/**
 * Fetches an artist's information and returns the genres
 * @param {string} artistId id of the artist associated with the track
 * @returns {Promise<Array<string>>} array of genres for this artist
 */
async function getArtistGenres(artistId) {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers });

  if (!res.ok) {
    throw new Error(`[Spotify] ❌ Failed to fetch album: ${albumId}`);
  }

  const artist = await res.json();

  return artist.genres ?? [];
}

/**
 * Main entry point for module: scrapes and caches music data.
 * @returns {Promise<Object>} Scraped music data.
 */
module.exports = async function fetchSpotifyMusic() {
  const cached = getFromCache("music");
  if (cached && OPTIONS.cache) {
    log("[Spotify]", "🗃️ Returning cached data");
    return cached;
  }

  time("[Spotify]", "🎵 Starting fresh scrape");
  await authenticateSpotify();

  const collection = {};
  for (const [key, playlistId] of Object.entries(PLAYLISTS)) {
    log("[Spotify]", `📥 Fetching playlist: ${key}`);
    const playlistData = await fetchPlaylistTracks(playlistId);
    collection[key] = await transformPlaylistItems(playlistData.items);
  }

  setIntoCache("music", collection);
  saveTestData("music.json", collection);

  timeEnd("[Spotify]", "✔️ Scraping completey");
  return collection;
};
