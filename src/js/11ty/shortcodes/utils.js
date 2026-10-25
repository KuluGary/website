import path from "node:path";

/**
 * Escapes a value for use inside an HTML attribute.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Escapes a value for use as HTML text content.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Returns the source path for a file.
 *
 * @param {string} section
 * @param {string} slug
 * @param {string} filename
 * @returns {string}
 */
export function getSourcePath(section, slug, filename) {
  return path.join(process.cwd(), "src", section, slug, "assets", filename);
}

/**
 * Returns the public URL for an original file.
 *
 * @param {string} section
 * @param {string} slug
 * @param {string} filename
 * @returns {string}
 */
export function getOriginalUrl(section, slug, filename) {
  return `/${section}/${slug}/assets/${filename}`;
}

/**
 * Returns the output directory used by Eleventy Image.
 *
 * @param {string} section
 * @param {string} slug
 * @returns {string}
 */
export function getOutputDirectory(section, slug) {
  return path.join(process.cwd(), "_site", section, slug, "assets");
}

/**
 * Returns whether a filename points to a GIF image.
 *
 * Animated GIFs bypass Eleventy Image processing.
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isGif(filename) {
  return path.extname(filename).toLowerCase() === ".gif";
}
