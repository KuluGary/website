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
 * Returns a copy of a section of an array. For both start and end, a negative index can be used to indicate an offset from the end of the array. For example, -2 refers to the second to last element of the array.
 *
 * @param {Array} arr - The array to slice
 * @param {*} start - The beginning index of the specified portion of the array. If start is undefined, then the slice begins at index 0.
 * @param {*} end - The end index of the specified portion of the array. This is exclusive of the element at the index 'end'. If end is undefined, then the slice extends to the end of the array.
 * @returns an array from index {start} to {end}
 */
export function slice(arr, start, end) {
  return arr.slice(start, end);
}

/**
 * Split a string into substrings using the specified separator and return them as an array.
 *
 * @param {string} str - The string to split
 * @param {string} separator -  A string that identifies character or characters to use in separating the string. If omitted, a single-element array containing the entire string is returned.
 * @returns {Array<string>} An array of substrings
 */
export function split(str, separator) {
  return String(str).split(separator);
}
