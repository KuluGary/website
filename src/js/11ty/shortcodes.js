import Image from "@11ty/eleventy-img";
import path from "node:path";
import fs from "node:fs";

const IMAGE_WIDTHS = [320, 400, 640, 960, 1280, 1920];

function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getSourcePath(section, fileSlug, filename) {
  return path.join(process.cwd(), "src", section, fileSlug, "assets", filename);
}

function getOriginalUrl(section, fileSlug, filename) {
  return `/${section}/${fileSlug}/assets/${filename}`;
}

async function generateOptimizedImage(section, fileSlug, filename) {
  const sourcePath = getSourcePath(section, fileSlug, filename);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Image not found: ${sourcePath}`);
  }

  const outputDir = path.join(process.cwd(), "_site", section, fileSlug, "assets");

  const urlPath = `/${section}/${fileSlug}/assets/`;

  return Image(sourcePath, {
    widths: IMAGE_WIDTHS,
    formats: ["avif", "webp", "jpeg"],
    outputDir,
    urlPath,
  });
}

export async function generateGallery(content, section, fileSlug) {
  const images = content
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [filename, alt = "", className = ""] = line.split("|").map((value) => value.trim());

      return {
        filename,
        alt,
        className,
      };
    });

  const generatedImages = await Promise.all(
    images.map(async (image) => ({
      ...image,
      metadata: await generateOptimizedImage(section, fileSlug, image.filename),
    })),
  );

  return `<div class="gallery">${generatedImages
    .map((image) => {
      const originalUrl = getOriginalUrl(section, fileSlug, image.filename);

      const imageHtml = Image.generateHTML(image.metadata, {
        alt: image.alt,
        loading: "lazy",
        decoding: "async",
        sizes: "(max-width: 700px) calc(100vw - 2rem), 360px",
      });

      return `<a
  href="${escapeAttribute(originalUrl)}"
  class="glightbox grid-item${image.className ? ` ${escapeAttribute(image.className)}` : ""}"
>
  ${imageHtml}
</a>`;
    })
    .join("")}</div>`;
}

export async function generateImage(content, section, fileSlug) {
  const [filename, description = "", className = ""] = content
    .trim()
    .split("|")
    .map((value) => value.trim());

  const metadata = await generateOptimizedImage(section, fileSlug, filename);

  const originalUrl = getOriginalUrl(section, fileSlug, filename);

  const imageHtml = Image.generateHTML(metadata, {
    alt: description,
    loading: "lazy",
    decoding: "async",
  });

  return `<figure class="${escapeAttribute(className)}">
  <a href="${escapeAttribute(originalUrl)}" class="glightbox">
    ${imageHtml}
  </a>${
    description
      ? `
    <figcaption>${escapeHtml(description)}</figcaption>`
      : ""
  }
</figure>`;
}
