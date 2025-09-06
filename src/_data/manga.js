const fetch = require("node-fetch");
const fs = require("fs");
const showdown = require("showdown");
const sanitize = require("sanitize-html");
const qs = require("querystring");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const { log, time, timeEnd } = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");
const { chunkArray } = require("../js/utils/array");

const coverPath = "src/assets/images/covers";

const converter = new showdown.Converter();

const ENDPOINTS = {
  MANGA_LIST: "https://api.mangadex.org/list/afb0fc3b-ad9c-44e4-ba9f-5e780f464ded",
  MANGA_BASE:
    "https://api.mangadex.org/manga?includes[]=cover_art&includes[]=artist&includes[]=author&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica",
  CHAPTER_BASE: "https://api.mangadex.org/chapter",
  FOLLOWS:
    "https://api.mangadex.org/user/follows/manga?&includes[]=cover_art&includes[]=artist&includes[]=author&includes[]=manga",
  STATUS: "https://api.mangadex.org/manga/status",
};

const AUTH_URL = "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token";

const OPTIONS = {
  cache: true,
  logError: false,
};

let headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

/**
 * Main entry point for module: scrapes and caches manga data.
 * @returns {Promise<Object>} Scraped manga data.
 */
module.exports = async function fetchMangaDex() {
  const cached = getFromCache("manga");
  if (cached && OPTIONS.cache) {
    log("[MangaDex]", "🗃️ Returning cached data");
    return cached;
  }

  await authenticate();

  time("[MangaDex]", "💬 Starting fresh scrape");
  const [followList, statusMap, favouriteList] = await Promise.all([
    fetchAllPaginated(ENDPOINTS.FOLLOWS, headers),
    fetchJSON(ENDPOINTS.STATUS, headers),
    fetchJSON(ENDPOINTS.MANGA_LIST),
  ]);

  const collection = { favourite: [] };
  for (const status of Object.values(statusMap.statuses)) {
    collection[status] = [];
  }

  const followManga = await fetchMangaDetails(followList);
  const favouriteManga = await fetchMangaDetails(favouriteList.data.relationships);

  for (const manga of followManga) {
    const status = statusMap.statuses[manga.id];
    if (status) {
      collection[status].push(await formatManga(manga));
    }
  }

  for (const manga of favouriteManga) {
    collection.favourite.push(await formatManga(manga));
  }

  setIntoCache("manga", collection);
  saveTestData("manga.json", collection);
  timeEnd("[MangaDex]", "✔️ Scraping complete");

  return collection;
};

/**
 * Authenticates with the MangaDex API and sets headers.
 */
async function authenticate() {
  const credentials = {
    grant_type: "password",
    username: process.env.MANGADEX_USERNAME,
    password: process.env.MANGADEX_PASSWORD,
    client_id: process.env.MANGADEX_CLIENT_ID,
    client_secret: process.env.MANGADEX_CLIENT_SECRET,
  };

  const formData = qs.stringify(credentials);

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  }).then((res) => res.json());

  headers.Authorization = `Bearer ${response.access_token}`;
}

/**
 * Fetches manga details based on ID relationships.
 * @param {Array} mangaRefs - Manga ID relationship array.
 * @returns {Promise<Object[]>}
 */
async function fetchMangaDetails(mangaRefs) {
  const ids = mangaRefs.filter((r) => r.type === "manga").map((r) => r.id);
  const chunks = chunkArray(ids, 100);
  const allData = [];

  for (const chunk of chunks) {
    const idsQuery = chunk.map((id) => `ids[]=${id}`).join("&");
    const url = `${ENDPOINTS.MANGA_BASE}&${idsQuery}&limit=${chunk.length}`;
    const response = await fetchJSON(url, headers);
    allData.push(...response.data);
  }

  return allData;
}

/**
 * Fetches the latest chapter for a specific manga
 * @param {string} chapterId
 * @returns {Object}
 */
async function fetchLatestChapter(chapterId) {
  const url = `${ENDPOINTS.CHAPTER_BASE}/${chapterId}`;
  const data = await fetchJSON(url, headers);

  return data;
}

/**
 * Converts raw API manga data into a formatted object.
 * @param {Object} manga - Raw MangaDex API manga object.
 * @returns {Object}
 */
async function formatManga(manga) {
  const id = manga.id;
  const title = manga.attributes.title.en || "Untitled";
  const descriptionHtml = converter.makeHtml(manga.attributes.description.en || "");
  const description = sanitize(descriptionHtml, {
    allowedTags: ["p"],
    disallowedTagsMode: "discard",
  });
  const latestChapter = await fetchLatestChapter(manga.attributes.latestUploadedChapter);

  const author = manga.relationships.find((r) => r.type === "author")?.attributes?.name || "Unknown";
  const genres = manga.attributes.tags
    .filter((tag) => tag.attributes.group === "genre")
    .map((tag) => tag.attributes?.name?.en);

  const rating = manga.attributes.contentRating;

  const coverArt = manga.relationships.find((r) => r.type === "cover_art")?.attributes?.fileName;
  const coverFileName = `${coverArt}.256.jpg`;
  const coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`;

  downloadCover(coverUrl, coverFileName);

  return {
    id,
    type: "manga",
    title,
    description,
    genres,
    author: { name: author },
    rating,
    link: manga.attributes.links?.raw,
    thumbnail: `/assets/images/covers/manga/${coverFileName}`,
    updatedAt: latestChapter.data?.attributes?.publishAt ?? manga.attributes.updatedAt,
  };
}

/**
 * Downloads and stores manga cover images locally.
 * @param {string} url - The URL of the cover image.
 * @param {string} fileName - The name to save the image as.
 */
async function downloadCover(url, fileName) {
  const buffer = await fetch(url)
    .then((res) => res.buffer())
    .catch((err) => OPTIONS.logError && console.error(err));
  const filePath = `${coverPath}/manga/${fileName}`;

  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, buffer);
}

/**
 * Fetches and parses JSON from a URL.
 * @param {string} url
 * @param {Object} headers
 * @returns {Promise<Object>}
 */
async function fetchJSON(url, headers = {}) {
  const response = await fetch(url, { method: "GET", headers });
  return response.json();
}

/**
 * Fetches and parses JSON with pagination.
 * @param {string} url
 * @param {Object} headers
 * @returns {Promise<Object>}
 */
async function fetchAllPaginated(url, headers = {}) {
  const limit = 100;
  let offset = 0;
  let allData = [];
  let hasMore = true;

  while (hasMore) {
    const paginatedUrl = `${url}&limit=${limit}&offset=${offset}`;
    const response = await fetchJSON(paginatedUrl, headers);
    allData = allData.concat(response.data);
    offset += limit;
    hasMore = response.total ? offset < response.total : response.data?.length === limit;
  }

  return allData;
}
