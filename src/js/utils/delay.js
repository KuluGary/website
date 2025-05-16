/**
 * Delay helper for controlled navigation.
 * @param {number} time - Time to wait in milliseconds.
 * @returns {Promise<void>}
 */
const delay = (time) => new Promise((res) => setTimeout(res, time));

module.exports = delay;
