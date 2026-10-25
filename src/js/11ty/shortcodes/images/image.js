import { generateFigure, generateOptimizedImage, parseImageContent } from "./image-utils.js";

/**
 * Generates a single responsive image wrapped in a Lightbox link.
 *
 * Nunjucks usage:
 *
 *     {% image section=category, slug=postSlug %}
 *     blender.png | A screenshot showing Blender. | Optional caption
 *     {% endimage %}
 *
 * @param {string} content
 * @param {ImageOptions} options
 * @returns {Promise<string>}
 */
export async function generateImage(content, { section, slug }) {
  const image = parseImageContent(content);

  const metadata = await generateOptimizedImage(section, slug, image.filename);

  return generateImageFigure(image, metadata, section, slug);
}

/**
 * Generates a figure for a standalone image.
 *
 * Standalone image captions are rendered as figcaptions.
 *
 * @param {ImageDefinition} image
 * @param {import("@11ty/eleventy-img").ImageMetadata | null} metadata
 * @param {string} section
 * @param {string} slug
 * @returns {string}
 */
function generateImageFigure(image, metadata, section, slug) {
  return generateFigure({
    image,
    metadata,
    section,
    slug,
    className: `${"image " + (image.className ?? "")}`,
    lightboxAttribute: "data-glightbox",
    showCaption: true,
  });
}

/**
 * @typedef {Object} ImageOptions
 * @property {string} section
 * @property {string} slug
 */

/**
 * @typedef {Object} ImageDefinition
 * @property {string} filename
 * @property {string} alt
 * @property {string} caption
 * @property {string} className
 */
