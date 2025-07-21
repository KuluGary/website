const { DateTime } = require("luxon");

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
  return DateTime.fromISO(isoString, { zone: "utc", locale: "en-US" }).toRelative();
}

/**
 * Sorts a collection of objects in descending order based on a date property.
 *
 * @param {Array<Object>} collection - The array of objects to sort.
 * @param {string} key - The key in each object that contains the date value.
 * @returns {Array<Object>} A new array sorted by the specified date property in descending order.
 */
function sortByDate(collection, key) {
  return collection.sort((a, b) => new Date(b[key]).getTime() - new Date(a[key]).getTime());
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
  return `/${rootUrl.at(1)}`;
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
