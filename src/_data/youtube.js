const puppeteer = require("puppeteer");
const { setIntoCache, getFromCache } = require("../js/utils/cache");
const { saveTestData } = require("../js/utils/save");
const log = require("../js/utils/log");
const fetch = require("node-fetch");
const { parseXML } = require("../js/utils/xml");

const PLAYLISTS = {
  favourites: "FLYZ470OLAQ3k2sAcPDX4erg",
};

/**
 * Handles scraping of all videos on a user's playlist page.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} url - The URL of the user's playlist page.
 * @returns {Promise<Object[]>} Array of video objects.
 */
async function scrapeVideoFromPlaylist(playlistId) {
  const videos = [];

  const xmlData = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`).then((res) =>
    res.text()
  );

  const data = parseXML(xmlData);

  for (const video of data.feed.entry) {
    videos.push({
      id: video.id,
      type: "Video",
      title: video.title,
      description: video["media:group"]["media:description"],
      link: video.link["@_href"],
      thumbnail: video["media:group"]["media:thumbnail"]["@_url"],
      createdAt: video.published,
      updatedAt: video.updated,
      author: { name: video.author.name, link: video.author.link },
      views: video["media:group"]["media:community"]["media:statistics"]["@_views"],
      rate: video["media:group"]["media:community"]["media:starRating"]["@_average"],
    });
  }

  return videos;
}

/**
 * Orchestrates scraping across all playlist.
 * @returns {Promise<Object>} Collection of videos grouped by playlist.
 */
async function getCollection() {
  const allVideos = {};
  try {
    for (const [playlistName, playlistId] of Object.entries(PLAYLISTS)) {
      log("[YouTube]", `🔍 Scraping ${playlistName}`);

      allVideos[playlistName] = await scrapeVideoFromPlaylist(playlistId);
    }

    return allVideos;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Main entry point for module: scrapes and caches YouTube data.
 * @returns {Promise<Object>} Scraped YouTube data.
 */
module.exports = async function fetchYoutubeVideos() {
  const cached = getFromCache("youtube");
  if (cached) {
    log("[YouTube]", "🗃️ Returning cached data");
    return cached;
  }

  log("[YouTube]", "💻 Starting fresh scrape");
  const data = await getCollection();
  setIntoCache("youtube", data);
  saveTestData("youtube.json", data);
  log("[YouTube]", "✔️ Scraping complete");

  return data;
};
