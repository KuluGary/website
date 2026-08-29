function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export function generateGallery(content, section, fileSlug) {
  const images = content
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [filename, alt = "", className = ""] = line.split("|").map((value) => value.trim());

      return {
        src: `/${section}/${fileSlug}/assets/${filename}`,
        alt,
        className,
      };
    });

  return `<div class="gallery">${images
    .map(
      (image) => `
<a
  href="${escapeAttribute(image.src)}"
  class="glightbox grid-item ${image.className ? ` ${escapeAttribute(image.className)}` : ""}"
>
  <img
    src="${escapeAttribute(image.src)}"
    alt="${escapeAttribute(image.alt)}"
  >
</a>`,
    )
    .join("")}</div>`;
}

export function generateImage(content, section, fileSlug) {
  const [filename, description = "", className = ""] = content
    .trim()
    .split("|")
    .map((value) => value.trim());

  const src = `/${section}/${fileSlug}/assets/${filename}`;

  return `<figure class="${escapeAttribute(className)}">
  <img
    src="${escapeAttribute(src)}"
    alt="${escapeAttribute(description)}"
  >${
    description
      ? `
  <figcaption>${escapeHtml(description)}</figcaption>`
      : ""
  }
</figure>`;
}
