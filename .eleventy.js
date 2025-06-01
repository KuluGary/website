const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require("markdown-it-attrs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const wordStats = require("@photogabble/eleventy-plugin-word-stats");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const {
  formatDate,
  limit,
  unslugify,
  formatNumber,
  sortByDate,
  getRootUrl,
  generateSocialMediaImage,
  uniqueById,
  log,
  mergeArrays,
} = require("./src/js/11ty/generic");
const {
  getPostsByYear,
  getPostsWithoutCurrent,
  getSimilarPosts,
  getFrequentTags,
  getCollectionStats,
  getUniqueTags,
  getShareUrl,
  getWebmentionsByUrl,
  isOwnWebmention,
  readableDateFromISO,
  size,
  webmentionsByType,
} = require("./src/js/11ty/blog");
const {
  getFrequentMediaTags,
  getRecentMedia,
  getMediaCategories,
  getMediaGenres,
  removeUnsafeManga,
} = require("./src/js/11ty/media");
require("dotenv").config();

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("rootURL", "https://kulugary.neocities.org");
  eleventyConfig.addPlugin(wordStats);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(require("@jgarber/eleventy-plugin-postcss"));
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addPassthroughCopy("./src/assets");
  eleventyConfig.addPassthroughCopy("./src/js/*.js");

  eleventyConfig.addWatchTarget("./src/css");
  eleventyConfig.addWatchTarget("./src/js");

  /** 11ty generic */
  eleventyConfig.addFilter("formatDate", formatDate);
  eleventyConfig.addFilter("sortByDate", sortByDate);
  eleventyConfig.addFilter("formatNumber", formatNumber);
  eleventyConfig.addFilter("getRootUrl", getRootUrl);
  eleventyConfig.addFilter("unslugify", unslugify);
  eleventyConfig.addFilter("limit", limit);
  eleventyConfig.addFilter("generateSocialMediaImage", generateSocialMediaImage);
  eleventyConfig.addFilter("uniqueById", uniqueById);
  eleventyConfig.addFilter("mergeArrays", mergeArrays);
  eleventyConfig.addFilter("log", log);

  /** 11ty blog */
  eleventyConfig.addCollection("postsByYear", getPostsByYear);
  eleventyConfig.addFilter("getShareUrl", getShareUrl);
  eleventyConfig.addFilter("getUniqueTags", getUniqueTags);
  eleventyConfig.addFilter("getCollectionStats", getCollectionStats);
  eleventyConfig.addFilter("getPostsWithoutCurrent", getPostsWithoutCurrent);
  eleventyConfig.addFilter("getFrequentTags", getFrequentTags);
  eleventyConfig.addFilter("getSimilarPosts", getSimilarPosts);
  eleventyConfig.addFilter("getWebmentionsByUrl", getWebmentionsByUrl);
  eleventyConfig.addFilter("isOwnWebmention", isOwnWebmention);
  eleventyConfig.addFilter("size", size);
  eleventyConfig.addFilter("webmentionsByType", webmentionsByType);
  eleventyConfig.addFilter("readableDateFromISO", readableDateFromISO);

  /** 11ty media */
  eleventyConfig.addFilter("removeUnsafeManga", removeUnsafeManga);
  eleventyConfig.addFilter("getFrequentMediaTags", getFrequentMediaTags);
  eleventyConfig.addCollection("recentMedia", getRecentMedia);
  eleventyConfig.addCollection("genrePages", getMediaGenres);
  eleventyConfig.addCollection("mediaCategories", getMediaCategories);

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
    data: {
      site: {
        url: "https://kulugary.neocities.org",
      },
    },
  };
};
