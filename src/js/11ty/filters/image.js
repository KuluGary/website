/**
 * Optimizes the images of an HTML block for RSS feeds
 * @param {string} html - The HTML string to modify
 * @param {string} siteUrl - The site URL to concatenate for the img URLs
 * @returns {string} Optimized HTML for RSS feeds
 */
export function optimizeRssImages(html, siteUrl) {
  return html.replace(
    /<picture>[\s\S]*?<img\b([^>]*?)data-rss-src=["']([^"']+)["']([^>]*)>[\s\S]*?<\/picture>/gi,
    (match, before, rssSrc, after) => {
      const widthMatch = match.match(/\bwidth=["'](\d+)["']/i);
      const heightMatch = match.match(/\bheight=["'](\d+)["']/i);
      const altMatch = match.match(/\balt=["']([^"']*)["']/i);

      const width = widthMatch?.[1] || "960";
      const height = heightMatch?.[1] || "";
      const alt = altMatch?.[1] || "";

      const src = new URL(rssSrc, siteUrl).href;

      return `<img src="${src}" width="${width}"${height ? ` height="${height}"` : ""} alt="${alt}">`;
    },
  );
}
