import { escapeAttribute } from "../utils.js";
import { generateFigure, generateOptimizedImage, parseImageList } from "./image-utils.js";

const GALLERY_SIZES = "(max-width: 700px) calc(100vw - 2rem), 360px";

/**
 * Generates a gallery from pipe-delimited image definitions.
 *
 * Nunjucks usage:
 *
 *     {% gallery
 *       section=category,
 *       slug=postSlug,
 *       class="my-gallery",
 *       style="--grid-cols:3"
 *     %}
 *     blender.png | Blender screenshot | Optional Lightbox description
 *     screenshot.png | Rendered scene
 *     {% endgallery %}
 *
 * Gallery captions are used only as Lightbox descriptions.
 *
 * @param {string} content
 * @param {GalleryOptions} options
 * @returns {Promise<string>}
 */
export async function generateGallery(content, { section, slug, class: className, style }) {
  const images = parseImageList(content);

  const figures = await Promise.all(
    images.map(async (image) => {
      const metadata = await generateOptimizedImage(section, slug, image.filename);

      return generateGalleryFigure(image, metadata, section, slug);
    }),
  );

  const attributes = [
    `class="gallery${className ? ` ${escapeAttribute(className)}` : ""}"`,
    style ? `style="${escapeAttribute(style)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<div ${attributes}>${figures.join("")}</div>`;
}

/**
 * Generates a figure for a gallery image.
 *
 * Gallery captions are used only as Lightbox descriptions.
 *
 * @param {ImageDefinition} image
 * @param {import("@11ty/eleventy-img").ImageMetadata | null} metadata
 * @param {string} section
 * @param {string} slug
 * @returns {string}
 */
function generateGalleryFigure(image, metadata, section, slug) {
  const className = image.className ? `grid-item ${escapeAttribute(image.className)}` : "grid-item";

  return generateFigure({
    image,
    metadata,
    section,
    slug,
    className,
    sizes: GALLERY_SIZES,
    lightboxAttribute: "data-glightbox",
    showCaption: false,
  });
}

/**
 * @typedef {Object} GalleryOptions
 * @property {string} section
 * @property {string} slug
 * @property {string} [class]
 * @property {string} [style]
 */
