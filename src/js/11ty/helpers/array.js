/**
 * Helper function to chunk an array into smaller arrays
 * @param {Array} array - The array to chunk
 * @param {number} size - The size of each chunk
 * @returns {Array<Array>} Array of chunks
 */
export function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
