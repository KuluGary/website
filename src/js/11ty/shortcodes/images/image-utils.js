import { escapeAttribute, escapeHtml, getOriginalUrl, getOutputDirectory, getSourcePath, isGif } from "../utils.js";
import Image from "@11ty/eleventy-img";
import fs from "node:fs";

const IMAGE_WIDTHS = [320, 400, 640, 960, 1280, 1920];

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
export function generateFigure({ image, metadata, section, slug, className, sizes, lightboxAttribute, showCaption }) {
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
 * Generates optimized image metadata with Eleventy Image.
 *
 * GIF files intentionally bypass processing so animations remain intact.
 *
 * @param {string} section
 * @param {string} slug
 * @param {string} filename
 * @returns {Promise<import("@11ty/eleventy-img").ImageMetadata | null>}
 */
export async function generateOptimizedImage(section, slug, filename) {
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
 * Parses multiple pipe-delimited image definitions.
 *
 * @param {string} content
 * @returns {ImageDefinition[]}
 */
export function parseImageList(content) {
  return content
    .trim()
    .split(/\r?\n/)
    .map(parseImageContent)
    .filter((image) => image.filename);
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
export function generateOptimizedImageHtml(metadata, alt, sizes) {
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

/**
 * Generates an unoptimized image.
 *
 * @param {string} src
 * @param {string} alt
 * @returns {string}
 */
export function generateOriginalImageHtml(src, alt) {
  return `<img
      src="${escapeAttribute(src)}"
      alt="${escapeAttribute(alt)}"
      loading="lazy"
      decoding="async"
    >`;
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
export function parseImageContent(content) {
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
