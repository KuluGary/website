const fetch = require("node-fetch");
const fs = require("fs");
const showdown = require("showdown");
const sanitize = require("sanitize-html");
const qs = require("querystring");
const { getFromCache, setIntoCache } = require("../js/utils/cache");
const log = require("../js/utils/log");
const { saveTestData } = require("../js/utils/save");

const DEBUG = false;
const coverPath = "src/assets/images/covers";

const converter = new showdown.Converter();

const ENDPOINTS = {
  MANGA_LIST: "https://api.mangadex.org/list/afb0fc3b-ad9c-44e4-ba9f-5e780f464ded",
  MANGA_BASE:
    "https://api.mangadex.org/manga?limit=32&offset=0&includes[]=cover_art&includes[]=artist&includes[]=author&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica",
  FOLLOWS: "https://api.mangadex.org/user/follows/manga?limit=100",
  STATUS: "https://api.mangadex.org/manga/status",
};

const AUTH_URL = "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token";

let headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
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
  const ids = mangaRefs
    .filter((r) => r.type === "manga")
    .map((r) => `&ids[]=${r.id}`)
    .join("");
  const url = `${ENDPOINTS.MANGA_BASE}${ids}`;
  const data = await fetchJSON(url, headers);
  return data.data;
}

/**
 * Converts raw API manga data into a formatted object.
 * @param {Object} manga - Raw MangaDex API manga object.
 * @returns {Object}
 */
function formatManga(manga) {
  const id = manga.id;
  const title = manga.attributes.title.en || "Untitled";
  const descriptionHtml = converter.makeHtml(manga.attributes.description.en || "");
  const description = sanitize(descriptionHtml, { allowedTags: ["p"], disallowedTagsMode: "discard" });

  const author = manga.relationships.find((r) => r.type === "author")?.attributes?.name || "Unknown";
  const genres = manga.attributes.tags
    .filter((tag) => tag.attributes.group === "genre")
    .map((tag) => tag.attributes?.name?.en);

  const updatedAt = manga.attributes.updatedAt;
  const rating = manga.attributes.contentRating;

  const coverArt = manga.relationships.find((r) => r.type === "cover_art")?.attributes?.fileName;
  const coverFileName = `${coverArt}.256.jpg`;
  const coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`;

  downloadCover(coverUrl, coverFileName);

  return {
    id,
    type: "Manga",
    title,
    description,
    genres,
    author: { name: author },
    rating,
    link: manga.attributes.links?.raw,
    thumbnail: `/assets/images/covers/manga/${coverFileName}`,
    updatedAt,
  };
}

/**
 * Downloads and stores manga cover images locally.
 * @param {string} url - The URL of the cover image.
 * @param {string} fileName - The name to save the image as.
 */
async function downloadCover(url, fileName) {
  const buffer = await fetch(url).then((res) => res.buffer());
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
 * Main entry point for module: scrapes and caches manga data.
 * @returns {Promise<Object>} Scraped manga data.
 */
module.exports = async function fetchMangaDex() {
  const cached = getFromCache("manga");
  if (cached && !DEBUG) {
    log("[MangaDex]", "🗃️ Returning cached data");
    return cached;
  }

  await authenticate();

  log("[MangaDex]", "💬 Starting fresh scrape");
  const [followList, statusMap, favouriteList] = await Promise.all([
    fetchJSON(ENDPOINTS.FOLLOWS, headers),
    fetchJSON(ENDPOINTS.STATUS, headers),
    fetchJSON(ENDPOINTS.MANGA_LIST),
  ]);

  const collection = { favourite: [] };
  for (const status of Object.values(statusMap.statuses)) {
    collection[status] = [];
  }

  const followManga = await fetchMangaDetails(followList.data);
  const favouriteManga = await fetchMangaDetails(favouriteList.data.relationships);

  followManga.forEach((manga) => {
    const status = statusMap.statuses[manga.id];
    if (status) {
      collection[status].push(formatManga(manga));
    }
  });

  favouriteManga.forEach((manga) => {
    collection.favourite.push(formatManga(manga));
  });

  setIntoCache("manga", collection);
  saveTestData("manga.json", collection);
  log("[MangaDex]", "✔️ Scraping complete");

  return collection;
};
