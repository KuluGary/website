const { setIntoCache, getFromCache } = require("../js/utils/cache");
const { saveTestData } = require("../js/utils/save");
const { log, time, timeEnd } = require("../js/utils/log");
const fetch = require("node-fetch");
const {
  startProgress,
  incrementProgress,
  stopProgress,
} = require("../js/utils/cli-progress");

const PLAYLISTS = {
  favourites: "FLYZ470OLAQ3k2sAcPDX4erg",
};
const OPTIONS = {
  cache: true,
};

async function fetchAllVideoDetails(videos) {
  const videoIds = videos
    .map((video) => video.contentDetails.videoId)
    .join(",");

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.append("part", "contentDetails");
  url.searchParams.append("part", "snippet");
  url.searchParams.append("part", "statistics");
  url.searchParams.append("id", videoIds);
  url.searchParams.append("key", process.env.YOUTUBE_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Error en la petición: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  return data.items.map((item) => ({
    id: item?.id,
    rate: item?.statistics?.likeCount,
    views: item?.statistics?.viewCount,
    duration: item?.contentDetails?.duration,
    tags: item?.snippet?.tags,
  }));
}

/**
 * Handles fetching of all videos on a user's playlist page.
 * @param {string} playlistId - The ID of the playlist to fetch
 * @return {Array<Object>} array of video elements
 */
async function fetchPlaylist(playlistId) {
  const videos = [];

  const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  url.searchParams.append("part", "snippet");
  url.searchParams.append("part", "contentDetails");
  url.searchParams.append("maxResults", "50");
  url.searchParams.append("playlistId", playlistId);
  url.searchParams.append("key", process.env.YOUTUBE_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Error en la petición: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const items = data.items || [];
  startProgress(items.length);

  const videoDetails = await fetchAllVideoDetails(items);

  try {
    for (const video of items) {
      const videoDetail = videoDetails.find(
        (detail) => detail.id === video.contentDetails.videoId
      );
      incrementProgress();

      videos.push({
        id: video.contentDetails.videoId,
        type: "videos",
        title: video.snippet.title,
        description: video.snippet.description,
        link: `https://youtube.com/watch?v=${video.contentDetails.videoId}`,
        thumbnail: video.snippet.thumbnails.standard?.url,
        createdAt: video.contentDetails.videoPublishedAt,
        updatedAt: video.snippet.publishedAt,
        author: {
          name: video.snippet.videoOwnerChannelTitle,
          link: `https://youtube.com/channel/${video.snippet.videoOwnerChannelId}`,
        },
        rate: videoDetail?.rate,
        views: videoDetail?.views,
        duration: videoDetail?.duration,
        tags: videoDetail?.tags,
      });
    }
  } catch (error) {
    console.log(error);
  }

  stopProgress();

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
      log("[Videos]", `🔍 Scraping ${playlistName}`);

      allVideos[playlistName] = await fetchPlaylist(playlistId);
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
  const cached = getFromCache("videos");
  if (cached && OPTIONS.cache) {
    log("[Videos]", "🗃️ Returning cached data");
    return cached;
  }

  time("[Videos]", "💻 Starting fresh scrape");
  const data = await getCollection();
  setIntoCache("videos", data);
  saveTestData("videos.json", data);
  timeEnd("[Videos]", "✔️ Scraping complete");

  return data;
};
