import Image from "@11ty/eleventy-img";
import fs from "node:fs";
import path from "node:path";

const IMAGE_WIDTHS = [320, 400, 640, 960, 1280, 1920];
const GALLERY_SIZES = "(max-width: 700px) calc(100vw - 2rem), 360px";
const DEFAULT_RULE_CHARACTER = "=";
const RULE_LENGTH = 120;

/**
 * @typedef {Object} ImageDefinition
 * @property {string} filename
 * @property {string} alt
 * @property {string} caption
 * @property {string} className
 */

/**
 * @typedef {Object} ImageOptions
 * @property {string} section
 * @property {string} slug
 */

/**
 * @typedef {Object} GalleryOptions
 * @property {string} section
 * @property {string} slug
 * @property {string} [class]
 * @property {string} [style]
 */

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
 * Generates a horizontal rule string.
 *
 * @param {string} [char="="]
 * @returns {string}
 */
export function addRule(char = DEFAULT_RULE_CHARACTER) {
  return char.repeat(RULE_LENGTH);
}

/**
 * Parses multiple pipe-delimited image definitions.
 *
 * @param {string} content
 * @returns {ImageDefinition[]}
 */
function parseImageList(content) {
  return content
    .trim()
    .split(/\r?\n/)
    .map(parseImageContent)
    .filter((image) => image.filename);
}

/**
 * Parses a single pipe-delimited image definition.
 *
 * Format:
 *
 *     filename|alt text|caption|class name
 *
 * All fields after the filename are optional.
 *
 * @param {string} content
 * @returns {ImageDefinition}
 */
function parseImageContent(content) {
  const [filename, alt = "", caption = "", className = ""] = content
    .trim()
    .split("|")
    .map((value) => value.trim());

  if (!filename) {
    throw new Error("An image filename is required.");
  }

  return {
    filename,
    alt,
    caption,
    className,
  };
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
    className: image.className,
    lightboxAttribute: "data-glightbox",
    showCaption: true,
  });
}

/**
 * Generates the common figure and Lightbox markup.
 *
 * Gallery captions are used as Lightbox descriptions only.
 * Standalone image captions are also rendered as figcaptions.
 *
 * @param {Object} options
 * @param {ImageDefinition} options.image
 * @param {import("@11ty/eleventy-img").ImageMetadata | null} options.metadata
 * @param {string} options.section
 * @param {string} options.slug
 * @param {string} [options.className]
 * @param {string} [options.sizes]
 * @param {"data-lightbox"|"data-glightbox"} options.lightboxAttribute
 * @param {boolean} options.showCaption
 * @returns {string}
 */
function generateFigure({ image, metadata, section, slug, className, sizes, lightboxAttribute, showCaption }) {
  const originalUrl = getOriginalUrl(section, slug, image.filename);

  const imageHtml = generateImageHtml(image, metadata, originalUrl, sizes);

  const lightboxAttributeHtml = image.caption
    ? `${lightboxAttribute}="description: ${escapeAttribute(image.caption)}"`
    : "";

  const caption = showCaption && image.caption ? `\n  <figcaption>${escapeHtml(image.caption)}</figcaption>` : "";

  return `<figure${className ? ` class="${className}"` : ""}>
  <a
    href="${escapeAttribute(originalUrl)}"
    class="glightbox"
    ${lightboxAttributeHtml}
  >
    ${imageHtml}
  </a>${caption}
</figure>`;
}

/**
 * Generates optimized or original image HTML.
 *
 * @param {ImageDefinition} image
 * @param {import("@11ty/eleventy-img").ImageMetadata | null} metadata
 * @param {string} originalUrl
 * @param {string} [sizes]
 * @returns {string}
 */
function generateImageHtml(image, metadata, originalUrl, sizes) {
  if (!metadata) {
    return generateOriginalImageHtml(originalUrl, image.alt);
  }

  return generateOptimizedImageHtml(metadata, image.alt, sizes);
}

/**
 * Escapes a value for use inside an HTML attribute.
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Escapes a value for use as HTML text content.
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Returns whether a filename points to a GIF image.
 *
 * Animated GIFs bypass Eleventy Image processing.
 *
 * @param {string} filename
 * @returns {boolean}
 */
function isGif(filename) {
  return path.extname(filename).toLowerCase() === ".gif";
}

/**
 * Returns the source path for an image.
 *
 * @param {string} section
 * @param {string} slug
 * @param {string} filename
 * @returns {string}
 */
function getSourcePath(section, slug, filename) {
  return path.join(process.cwd(), "src", section, slug, "assets", filename);
}

/**
 * Returns the public URL for an original image.
 *
 * @param {string} section
 * @param {string} slug
 * @param {string} filename
 * @returns {string}
 */
function getOriginalUrl(section, slug, filename) {
  return `/${section}/${slug}/assets/${filename}`;
}

/**
 * Returns the output directory used by Eleventy Image.
 *
 * @param {string} section
 * @param {string} slug
 * @returns {string}
 */
function getOutputDirectory(section, slug) {
  return path.join(process.cwd(), "_site", section, slug, "assets");
}

/**
 * Generates optimized image metadata with Eleventy Image.
 *
 * GIF files intentionally bypass processing so animations remain intact.
 *
 * @param {string} section
 * @param {string} slug
 * @param {string} filename
 * @returns {Promise<import("@11ty/eleventy-img").ImageMetadata | null>}
 */
async function generateOptimizedImage(section, slug, filename) {
  const sourcePath = getSourcePath(section, slug, filename);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Image not found: ${sourcePath}`);
  }

  if (isGif(filename)) {
    return null;
  }

  return Image(sourcePath, {
    widths: IMAGE_WIDTHS,
    formats: ["avif", "webp", "jpeg"],
    outputDir: getOutputDirectory(section, slug),
    urlPath: `/${section}/${slug}/assets/`,
  });
}

/**
 * Generates an unoptimized image.
 *
 * @param {string} src
 * @param {string} alt
 * @returns {string}
 */
function generateOriginalImageHtml(src, alt) {
  return `<img
      src="${escapeAttribute(src)}"
      alt="${escapeAttribute(alt)}"
      loading="lazy"
      decoding="async"
    >`;
}

/**
 * Generates responsive HTML from Eleventy Image metadata.
 *
 * Adds the 960px JPEG as a data attribute for RSS consumers.
 *
 * @param {import("@11ty/eleventy-img").ImageMetadata} metadata
 * @param {string} alt
 * @param {string} [sizes]
 * @returns {string}
 */
function generateOptimizedImageHtml(metadata, alt, sizes) {
  const html = Image.generateHTML(metadata, {
    alt,
    loading: "lazy",
    decoding: "async",
    ...(sizes && { sizes }),
  });

  const rssImage = metadata.jpeg?.find((image) => image.width === 960);

  if (!rssImage) {
    return html;
  }

  return html.replace("<img", `<img data-rss-src="${escapeAttribute(rssImage.url)}"`);
}
