import { DateTime, Duration } from "luxon";

/**
 * Formats a given date into a specified string format using Luxon's DateTime.
 *
 * @param {Date|string} date - The date to format. Can be a JavaScript Date object or a date string.
 * @param {string} [format="dd/LL/yyyy"] - The format string following Luxon's formatting tokens.
 * @param {string} [locale="en"] - The locale to use for the date generation.
 * @returns {string} The formatted date string.
 */
export function formatDate(date, format = "dd/LL/yyyy", locale = "en") {
  return DateTime.fromJSDate(typeof date === "string" ? new Date(date) : date, {
    zone: "utc",
  })
    .setLocale(locale)
    .toFormat(String(format));
}

/**
 * Formats a given duration into a specified string format using Luxon's Duration
 *
 * @param {number} seconds - A duration in seconds
 * @param {string} format - The format string following Luxon's formatting tokens
 * @returns {string} The formatted duration string
 */
export function formatDuration(seconds, format = "hh:mm:ss") {
  const duration = Duration.fromObject({ seconds });

  if (seconds < 3600) {
    const minutes = Math.round(duration.as("minutes"));
    return `${minutes} minutes`;
  }

  const hours = Math.round(duration.as("hours") * 10) / 10;

  // Use comma as decimal separator
  const formattedHours = hours.toFixed(1).replace(".", ",");

  return `${formattedHours} hours`;
}

/**
 * Returns a new array containing only the first `limit` elements of the input array.
 *
 * @param {Array} array - The array to limit.
 * @param {number} [limit=0] - The maximum number of elements to include in the returned array.
 * @returns {Array} A new array containing up to `limit` elements from the start of the input array.
 */
export function limit(array, limit = 0) {
  return array.slice(0, limit);
}

/**
 * Sorts a collection of objects in descending order based on a date property.
 *
 * @param {Array<Object>} collection - The array of objects to sort.
 * @param {string} key - The key in each object that contains the date value.
 * @returns {Array<Object>} A new array sorted by the specified date property in descending order.
 */
export function sortByDate(collection, key) {
  return collection.sort((a, b) => {
    return new Date(b[key]).getTime() - new Date(a[key]).getTime();
  });
}

/**
 * Slices an array
 *
 * @param {*} arr
 * @param {*} start
 * @param {*} end
 * @returns an array from index {start} to {end}
 */
export function slice(arr, start, end) {
  return arr.slice(start, end);
}

/**
 * Splits a string into an array of substrings using a separator
 *
 * @param {string} str - The string to split
 * @param {string} separator - The separator to use for splitting
 * @returns {Array<string>} An array of substrings
 */
export function split(str, separator) {
  return String(str).split(separator);
}

/**
 * Pads the number passed as an argument with N amount of 0
 * @param {number} number the number to be padded
 * @param {number} amount the amount of 0 to be padded with
 * @returns a string of a padded number
 */
export function pad(number, amount = 1) {
  return String(number).padStart(amount, "0");
}

/**
 * Parses a slug or formatted string into a human-readable string with capitalized words.
 *
 * @param {string} slug - The input string containing words separated by hyphens, underscores, dots, or spaces.
 * @returns {string} A human-readable string with each word capitalized and separated by spaces.
 */
export function unslugify(slug) {
  return slug
    .toLowerCase()
    .split(/[-_.\s]/)
    .map((w) => `${w.charAt(0).toUpperCase()}${w.substr(1)}`)
    .join(" ");
}

/**
 * Filters a list of webmentions to exclude ones made by owner
 * @param {object} webmentions list of webmentions
 * @returns list of webmentions without the owned owns
 */
export function filterOwnWebmentions(webmentions) {
  function isOwnWebmention(webmention) {
    const urls = [
      "https://kulugary.neocities.org",
      "https://gary.place",
      "https://bsky.app/profile/kulugary.itch.io",
      "https://kulugary.tumblr.com/",
      "https://indiepocalypse.social/@kulugary",
      "https://tilde.zone/@gary",
      "https://github.com/KuluGary",
      "https://www.reddit.com/user/KuluGary/",
    ];

    const authorUrl = webmention.author ? webmention.author.url : false;

    return authorUrl && urls.includes(authorUrl);
  }

  return webmentions.filter((webmention) => !!webmention.author.url && !isOwnWebmention(webmention));
}

/**
 * Filters a list of webmentions to return only the ones by post
 * @param {object} webmentions list of all webmentions
 * @param {string} url url of the post
 * @returns list of webmentions filtered by post
 */
export function getWebmentionsByUrl(webmentions, url) {
  return webmentions.filter((entry) => entry["wm-target"].includes(url));
}

/**
 * Filters a list of webmentions to return only the ones with specified type
 * @param {object} mentions list of all webmentions
 * @param {string} mentionType type of webmention
 * @returns list of webmentions by type
 */
export function webmentionsByType(webmentions, mentionType) {
  return webmentions.filter((entry) => entry["wm-property"] === mentionType);
}
/**
 * Filters Eleventy posts by language.
 * @param {Array<Object>} collection - A list of Eleventy collection items.
 * @param {string} lang - Language code to keep.
 * @returns {Array<Object>} Posts matching the language.
 */
export function filterByLang(collection, lang = "en") {
  return collection.filter((post) => post.data.lang === lang);
}

/**
 * Returns other language variants for the current blog post.
 * @param {Array<Object>} collection - A list of Eleventy collection items.
 * @param {string} postSlug - Shared folder slug for the post.
 * @param {string} currentUrl - Current page URL.
 * @returns {Array<Object>} Translated variants of the current post.
 */
export function getTranslations(collection, postSlug, currentUrl) {
  return collection
    .filter((post) => post.data.postSlug === postSlug && post.url !== currentUrl)
    .sort((a, b) => a.data.lang.localeCompare(b.data.lang));
}
