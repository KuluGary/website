const { DateTime } = require("luxon");
const fs = require("fs");
const postcss = require("postcss");
const postcssConfig = require("../../../postcss.config");
const path = require("path");
const { log: consoleLog, time, timeEnd } = require("../utils/log");
const { startProgress, incrementProgress, stopProgress } = require("../utils/cli-progress");

module.exports = {
  formatDate,
  sortByDate,
  formatNumber,
  getRootUrl,
  slugify,
  unslugify,
  limit,
  generateSocialMediaImage,
  uniqueById,
  log,
  mergeArrays,
  isoStringToRelativeTime,
  objToArray,
  isArray,
  generateSitemap,
  makeLowercase,
  makeUppercase,
  minutesToHoursMinutes,
  generateChattableCSS,
};

/**
 * Formats a given date into a specified string format using Luxon's DateTime.
 *
 * @param {Date|string} date - The date to format. Can be a JavaScript Date object or a date string.
 * @param {string} [format="dd/LL/yyyy"] - The format string following Luxon's formatting tokens.
 * @returns {string} The formatted date string.
 */
function formatDate(date, format = "dd/LL/yyyy") {
  return DateTime.fromJSDate(typeof date === "string" ? new Date(date) : date, {
    zone: "utc",
  }).toFormat(String(format));
}

/**
 * Converts an ISO 8601 date string to a human-readable relative time string.
 *
 * Uses Luxon's `DateTime.fromISO` and `toRelative()` to produce strings like
 * "3 hours ago", "in 2 days", etc.
 *
 * @param {string} isoString - The ISO 8601 date string to convert.
 * @returns {string | null} A relative time string (e.g., "2 days ago") or `null` if the input is invalid.
 */
function isoStringToRelativeTime(isoString) {
  return DateTime.fromISO(isoString, {
    zone: "utc",
    locale: "en-US",
  }).toRelative();
}

/**
 * Sorts a collection of objects in descending order based on a date property.
 *
 * @param {Array<Object>} collection - The array of objects to sort.
 * @param {string} key - The key in each object that contains the date value.
 * @returns {Array<Object>} A new array sorted by the specified date property in descending order.
 */
function sortByDate(collection, key) {
  return collection.sort((a, b) => {
    console.log(new Date(b[key]), new Date(a[key]), new Date(b[key]).getTime() - new Date(a[key]).getTime());

    return new Date(b[key]).getTime() - new Date(a[key]).getTime();
  });
}

/**
 * Formats a number using the specified notation style with English locale formatting.
 *
 * @param {number} number - The number to format.
 * @param {"standard" | "scientific" | "engineering" | "compact"} notation - The formatting notation style.
 * @returns {string} The formatted number as a string.
 */
function formatNumber(number, notation) {
  const formatter = Intl.NumberFormat("en", { notation });
  return formatter.format(number);
}

/**
 * Parses a slug or formatted string into a human-readable string with capitalized words.
 *
 * @param {string} slug - The input string containing words separated by hyphens, underscores, dots, or spaces.
 * @returns {string} A human-readable string with each word capitalized and separated by spaces.
 */
function unslugify(slug) {
  return slug
    .toLowerCase()
    .split(/[-_.\s]/)
    .map((w) => `${w.charAt(0).toUpperCase()}${w.substr(1)}`)
    .join(" ");
}

/**
 * Parses a human-readable string into a slug
 * @param {string} string string to parse into slug
 * @returns slugified string
 */
function slugify(string) {
  return string
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[-\s]+/g, "-");
}

/**
 * Returns a new array containing only the first `limit` elements of the input array.
 *
 * @param {Array} array - The array to limit.
 * @param {number} [limit=0] - The maximum number of elements to include in the returned array.
 * @returns {Array} A new array containing up to `limit` elements from the start of the input array.
 */
function limit(array, limit = 0) {
  return array.slice(0, limit);
}

/**
 * Extracts the root path segment from a URL string.
 *
 * @param {string} url - The full URL or path string (e.g., "/products/item/123").
 * @returns {string} The root-level path segment, including the leading slash (e.g., "/products").
 */
function getRootUrl(url) {
  const rootUrl = url.split("/");
  return `/${rootUrl.at(1)}/${rootUrl.at(2)}`;
}

/**
 * Logs the params into the console
 * @param {any} any
 */
function log(any) {
  console.log(any);
}

/**
 * Generates a full URL for a social media share image.
 *
 * @param {string} imageSrc - The image source path or URL.
 * @returns {string} A full URL to the social media image. Defaults to a fallback image if none is provided.
 */
function generateSocialMediaImage(imageSrc) {
  if (!imageSrc) return `https://kulugary.neocities.org/assets/images/textures/social-share.jpg`;

  if (imageSrc.startsWith("https://")) return imageSrc;

  return `https://kulugary.neocities.org${imageSrc}`;
}

function uniqueById(array) {
  return array.filter((obj1, i, arr) => arr.findIndex((obj2) => obj2.id === obj1.id) === i);
}

function mergeArrays(array1, array2) {
  return [...array1, ...array2];
}

function objToArray(obj) {
  return Object.entries(obj);
}

function isArray(element) {
  return Array.isArray(element);
}

/**
 * Generates a filtered and sorted list of pages for use in a sitemap.
 *
 * This function:
 * - Retrieves all pages from the Eleventy `collectionApi`.
 * - Excludes assets (`.css`, `.js`, `.json`, `.xml`, `.txt`, `.map`).
 * - Includes `/blog/` but excludes individual `/blog/...` posts.
 * - Excludes pages under `/genre/` and `/status/` and `/prose/`.
 * - Sorts results into groups:
 *   1. Home (`/`)
 *   2. Blog index (`/blog/`)
 *   3. Blog posts (`/blog/...`), sorted by descending `date`.
 *   4. All other pages, sorted alphabetically by URL.
 *
 * @function generateSitemap
 * @param {Object} collectionApi - The Eleventy collection API object.
 * @param {Function} collectionApi.getAll - Returns all available pages.
 * @returns {Array<Object>} A list of page objects filtered and sorted for sitemap inclusion.
 */
function generateSitemap(collectionApi) {
  return collectionApi
    .getAll()
    .filter((page) => {
      return (
        page.url &&
        !page.url.match(/\.(css|js|json|xml|txt|map)$/) &&
        (page.url === "/blog/" || !page.url.startsWith("/blog/")) &&
        !page.url.includes("/genre/") &&
        !page.url.includes("/status/") &&
        !page.url.includes("/prose/")
      );
    })
    .sort((a, b) => {
      const group = (url) => {
        if (url === "/") return 0;
        if (url === "/blog/") return 1;
        if (url.startsWith("/blog/")) return 2;
        return 3;
      };

      const groupA = group(a.url);
      const groupB = group(b.url);

      if (groupA !== groupB) {
        return groupA - groupB;
      }

      if (groupA === 2) {
        return (b.date || 0) - (a.date || 0);
      }

      return a.url.localeCompare(b.url);
    });
}

function makeUppercase(string) {
  return string.toUpperCase();
}

function makeLowercase(string) {
  return string.toLowerCase();
}

function minutesToHoursMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Generates preprocessed CSS bundles for the "Chattable" UI.
 *
 * This function combines theme variables, font stacks, and font sizes
 * from `themes.css` with base styles from `chattable/base.css`, then processes
 * them with PostCSS. It outputs all combinations of
 * `theme × font-stack × font-size` into `_site/css/chattable`.
 *
 * The function uses a cache file (`.chattable-theme-cache.json`)
 * to avoid regenerating CSS unless the source files have changed.
 */
async function generateChattableCSS() {
  const themeCssPath = "src/css/themes.css";
  const baseCssPath = "src/css/chattable/base.css";
  const outDir = "_site/css/chattable";

  // Cache file to store last modified time of theme.css
  const cacheFile = ".chattable-theme-cache.json";

  const themeCssStat = fs.statSync(themeCssPath);
  const baseCssStat = fs.statSync(baseCssPath);

  const latestMtime = Math.max(themeCssStat.mtimeMs, baseCssStat.mtimeMs);

  let cachedTime = 0;
  if (fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      cachedTime = cache.mtime || 0;
    } catch {}
  }

  // Only rebuild if theme.css has changed
  if (latestMtime <= cachedTime) {
    consoleLog("[Chattable]", "Skipping generation.");
    return;
  }

  time("[Chattable]", "Generating CSS...");

  const themeCss = fs.readFileSync(themeCssPath, "utf8");
  const baseCss = fs.readFileSync(baseCssPath, "utf8");

  const themeBlocks = [...themeCss.matchAll(/html\[data-theme="([^"]+)"\]\s*{([^}]+)}/g)];
  const fontStackBlocks = [...themeCss.matchAll(/html\[data-font-stack="([^"]+)"\]\s*{([^}]+)}/g)];
  const fontSizeBlocks = [...themeCss.matchAll(/html\[data-font-size="([^"]+)"\]\s*{([^}]+)}/g)];

  if (!themeBlocks.length) {
    console.warn("No theme blocks found in themes.css");
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  startProgress(themeBlocks.length + fontStackBlocks + fontSizeBlocks);

  // For each combination of theme × font-stack × font-size
  for (const [, themeName, themeVars] of themeBlocks) {
    for (const [, stackName, stackVars] of fontStackBlocks) {
      for (const [, sizeName, sizeVars] of fontSizeBlocks) {
        const rootCss = `:root {\n${themeVars}\n${stackVars}\n${sizeVars}\n}`;
        const mergedCss = `${rootCss}\n${baseCss}`;

        const result = await postcss(postcssConfig.plugins).process(mergedCss, { from: undefined });

        const fileName = `${themeName}-${stackName}-${sizeName}.css`;
        fs.writeFileSync(path.join(outDir, fileName), result.css, "utf8");
        incrementProgress();
      }
    }
  }

  stopProgress();

  fs.writeFileSync(cacheFile, JSON.stringify({ mtime: latestMtime }), "utf8");
  timeEnd("[Chattable]", "✔️ Generation complete");
}
