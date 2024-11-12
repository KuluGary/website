const {
  postsByYear,
  formatDate,
  filterMangaOnlySafe,
  generateShareUrl,
  uniqueTags,
  unslugify,
  generateSocialMediaImage,
  limit,
} = require("./src/js/eleventyConfig");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require("markdown-it-attrs");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("rootURL", "https://kulugary.neocities.org");
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addPassthroughCopy("./src/assets");
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/js");

  eleventyConfig.addWatchTarget("./src/css");
  eleventyConfig.addWatchTarget("./src/js");

  eleventyConfig.addFilter("formatDate", formatDate);
  eleventyConfig.addFilter("shareUrl", generateShareUrl);
  eleventyConfig.addFilter("filterMangaOnlySafe", filterMangaOnlySafe);
  eleventyConfig.addFilter("uniqueTags", uniqueTags);
  eleventyConfig.addFilter("unslugify", unslugify);
  eleventyConfig.addFilter(
    "generateSocialMediaImage",
    generateSocialMediaImage
  );
  eleventyConfig.addFilter("limit", limit);

  eleventyConfig.addCollection("postsByYear", postsByYear);

  eleventyConfig.setLibrary(
    "md",
    markdownIt({
      html: true,
      breaks: true,
      linkify: true,
    })
      .use(markdownItAnchor, {
        permalink: true,
        permalinkClass: "direct-link",
        permalinkSymbol: "🔗",
      })
      .use(markdownItAttrs)
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
