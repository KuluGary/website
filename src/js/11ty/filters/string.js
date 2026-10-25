/**
 *Pads the current string with a given string (possibly repeated) so that the resulting string reaches a given length. The padding is applied from the start (left) of the current string.
 * @param {number} number the number to be padded
 * @param {number} amount The length of the resulting string once the current string has been padded. If this parameter is smaller than the current string's length, the current string will be returned as it is.
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
