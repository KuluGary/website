const ASCII_REPLACEMENTS = [
  [/[\u201C\u201D]/g, '"'],
  [/[\u2018\u2019]/g, "'"],
  [/\u2014/g, "--"],
  [/\u2013/g, "-"],
  [/\u2026/g, "..."],
  [/\u00A0/g, " "],
];

/**
 * Optimizes the images and iframes of an HTML block for plaintext
 * @param {string} html - The HTML string to modify
 * @returns {string} Optimized HTML for plaintext
 */
export function plaintextHtml(html) {
  return (
    html
      // Iframes
      .replace(/<iframe([^>]*)>(?:[\s\S]*?)<\/iframe>/gi, (_, attributes) => {
        const src = attributes.match(/\bsrc="([^"]*)"/i)?.[1] ?? "";
        const title = attributes.match(/\btitle="([^"]*)"/i)?.[1] ?? "";

        if (!src) {
          return "";
        }

        const label = title || "Embedded content";

        return `<p><a href="${src}" aria-label="${label}">[Iframe: ${label}]</a></p>`;
      })

      // Individual optimized images
      .replace(
        /<figure[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>\s*<picture>[\s\S]*?<img([^>]*)>[\s\S]*?<\/picture>\s*<\/a>([\s\S]*?)<\/figure>/g,
        (_, imageUrl, imgAttributes, caption) => {
          const alt = imgAttributes.match(/alt="([^"]*)"/)?.[1] ?? "";

          return `<p><a href="${imageUrl}" aria-label="${alt}">[Image: ${alt || caption.trim()}]</a></p>`;
        },
      )

      // Individual GIFs / non-optimized images
      .replace(
        /<figure[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>\s*<img([^>]*)>\s*<\/a>([\s\S]*?)<\/figure>/g,
        (_, imageUrl, imgAttributes, caption) => {
          const alt = imgAttributes.match(/alt="([^"]*)"/)?.[1] ?? "";

          return `<p><a href="${imageUrl}" aria-label="${alt}">[Image: ${alt || caption.trim()}]</a></p>`;
        },
      )

      // Galleries
      .replace(/<div class="gallery">([\s\S]*?)<\/div>/g, (_, gallery) => {
        const images = [];
        const imagePattern = /<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img([^>]*)>[\s\S]*?<\/a>/g;

        let match;

        while ((match = imagePattern.exec(gallery)) !== null) {
          const imageUrl = match[1];
          const imgAttributes = match[2];
          const alt = imgAttributes.match(/alt="([^"]*)"/)?.[1] ?? "";

          images.push(`<p><a href="${imageUrl}" aria-label="${alt}">Image: ${alt}</a></p>`);
        }

        return images.join("\n");
      })
  );
}

/**
 * Normalise typographic punctuation to ASCII.
 * Non-Latin scripts and accented characters aren't modified.
 * @param {string} str - Raw HTML to parse
 * @returns {string} - ASCIIfied string
 */
export function asciiPunct(str) {
  if (typeof str !== "string") return str;
  let out = str;
  for (const [pattern, replacement] of ASCII_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Parses a URL into its plaintext counterpart
 * @param {string} url - URL to parse
 * @returns parsed URL
 */
export function plainUrl(url) {
  return process.env.ELEVENTY_MODE === "plain" ? url : `/plain${url}`;
}
