import pluginRss from "@11ty/eleventy-plugin-rss";
import PostCSSPlugin from "@jgarber/eleventy-plugin-postcss";
import syntaxHighlight from "@pborenstein/eleventy-md-syntax-highlight";
import postGraph from "@rknightuk/eleventy-plugin-post-graph";
import dotenv from "dotenv";
import timeToRead from "eleventy-plugin-time-to-read";
import pluginTOC from "eleventy-plugin-toc";
import {
  gameAmountByStatus,
  getArtPosts,
  getBlogPosts,
  getBlogTagPages,
  getFeaturedBlogPosts,
  getFrequentTags,
  getFrequentTagsByYear,
  getGamesByLastPlayed,
  getGamesByYear,
  getGamesWithReviews,
  getJournalPosts,
  getJournalTagPages,
  getPopularPosts,
  getPostsByYear,
} from "./src/js/11ty/collections.js";
import {
  filterOwnWebmentions,
  formatDate,
  formatDuration,
  formatWithOrdinal,
  getSimilarPosts,
  getWebmentionsByUrl,
  limit,
  pad,
  slice,
  sortByDate,
  split,
  unslugify,
  webmentionsByType,
} from "./src/js/11ty/filters.js";
import mdIt from "./src/js/lib/markdown-it.js";
import getShareUrl from "./src/js/social-media.js";

dotenv.config();
export default async function (eleventyConfig) {
  eleventyConfig.addGlobalData("rootURL", process.env.ROOT_URL);
  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("./src/assets");
  eleventyConfig.addPassthroughCopy("./src/blog/**/assets");
  eleventyConfig.addPassthroughCopy("./src/art/**/assets");
  eleventyConfig.addPassthroughCopy("./src/journal/**/assets");

  eleventyConfig.addWatchTarget("./src/css");
  eleventyConfig.addWatchTarget("./src/js");
  eleventyConfig.addWatchTarget("./src/blog/**/*.md");
  eleventyConfig.addWatchTarget("./src/art/**/*.md");

  eleventyConfig.addExtension("11ty.ts", { key: "11ty.js" });
  eleventyConfig.addTemplateFormats("11ty.ts");

  /** Filters */
  eleventyConfig.addFilter("formatDate", formatDate);
  eleventyConfig.addFilter("formatWithOrdinal", formatWithOrdinal);
  eleventyConfig.addFilter("formatDuration", formatDuration);
  eleventyConfig.addFilter("limit", limit);
  eleventyConfig.addFilter("sortByDate", sortByDate);
  eleventyConfig.addFilter("slice", slice);
  eleventyConfig.addFilter("split", split);
  eleventyConfig.addFilter("pad", pad);
  eleventyConfig.addFilter("unslugify", unslugify);
  eleventyConfig.addFilter("getSimilarPosts", getSimilarPosts);
  eleventyConfig.addFilter("filterOwnWebmentions", filterOwnWebmentions);
  eleventyConfig.addFilter("filterOwnWebmentions", filterOwnWebmentions);
  eleventyConfig.addFilter("getWebmentionsByUrl", getWebmentionsByUrl);
  eleventyConfig.addFilter("webmentionsByType", webmentionsByType);
  eleventyConfig.addFilter("getShareUrl", getShareUrl);
  eleventyConfig.addFilter("randomBetween", (_, min, max, decimals = 3) => {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
  });
  /* Markdown */
  eleventyConfig.setLibrary("md", mdIt);

  /* Plugins */
  eleventyConfig.addPlugin(pluginTOC);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(timeToRead);
  eleventyConfig.addPlugin(PostCSSPlugin);
  eleventyConfig.addPlugin(postGraph, { limit: 1, sort: "desc", noLabels: true, noStyles: true });
  eleventyConfig.addPlugin(pluginRss);

  /** Collections */
  eleventyConfig.addCollection("blog", getBlogPosts);
  eleventyConfig.addCollection("journal", getJournalPosts);
  eleventyConfig.addCollection("art", getArtPosts);
  eleventyConfig.addCollection("postsByYear", getPostsByYear);
  eleventyConfig.addCollection("frequentTags", getFrequentTags);
  eleventyConfig.addCollection("frequentTagsByYear", getFrequentTagsByYear);
  eleventyConfig.addCollection("gameAmountByStatus", gameAmountByStatus);
  // eleventyConfig.addCollection("comicsAmountByStatus", comicsAmountByStatus);
  // eleventyConfig.addCollection("filmsAmountByStatus", filmsAmountByStatus);
  eleventyConfig.addCollection("popularPosts", getPopularPosts);
  eleventyConfig.addCollection("gamesByLastPlayed", getGamesByLastPlayed);
  eleventyConfig.addCollection("gamesByYear", getGamesByYear);
  eleventyConfig.addCollection("featuredBlogPosts", getFeaturedBlogPosts);
  eleventyConfig.addCollection("gamesWithReviews", getGamesWithReviews);
  eleventyConfig.addCollection("blogTagPages", getBlogTagPages);
  eleventyConfig.addCollection("journalTagPages", getJournalTagPages);

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "data",
      output: "_site",
      layouts: "_layouts",
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
}
