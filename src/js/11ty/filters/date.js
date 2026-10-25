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
