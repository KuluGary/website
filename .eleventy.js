import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import PostCSSPlugin from "@jgarber/eleventy-plugin-postcss";
import dotenv from "dotenv";
import timeToRead from "eleventy-plugin-time-to-read";
import pluginTOC from "eleventy-plugin-toc";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import string from "string";
import {
  comicsAmountByStatus,
  filmsAmountByStatus,
  gameAmountByStatus,
  getBlogPosts,
  getFrequentTags,
  getFrequentTagsByYear,
  getGamesByLastPlayed,
  getGamesByYear,
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
  unslugify,
  webmentionsByType,
} from "./src/js/11ty/filters.js";
import processThumbs from "./src/js/lib/process-imgs.js";
import postGraph from "@rknightuk/eleventy-plugin-post-graph";

dotenv.config();

const slugify = (s) => string(s).slugify().toString();

const mdOptions = {
  html: true,
  breaks: true,
};

const mdAnchorOpts = {
  permalink: markdownItAnchor.permalink.linkInsideHeader({
    symbol: "#",
    class: "anchor-link",
  }),
  level: [1, 2, 3, 4],
  slugify,
};

export default async function (eleventyConfig) {
  eleventyConfig.addGlobalData("rootURL", process.env.ROOT_URL);
  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("./src/assets");
  eleventyConfig.addPassthroughCopy("./src/blog/**/assets");

  eleventyConfig.addWatchTarget("./src/css");
  eleventyConfig.addWatchTarget("./src/js");

  eleventyConfig.addExtension("11ty.ts", { key: "11ty.js" });
  eleventyConfig.addTemplateFormats("11ty.ts");

  /** Filters */
  eleventyConfig.addFilter("formatDate", formatDate);
  eleventyConfig.addFilter("formatWithOrdinal", formatWithOrdinal);
  eleventyConfig.addFilter("formatDuration", formatDuration);
  eleventyConfig.addFilter("limit", limit);
  eleventyConfig.addFilter("sortByDate", sortByDate);
  eleventyConfig.addFilter("slice", slice);
  eleventyConfig.addFilter("pad", pad);
  eleventyConfig.addFilter("unslugify", unslugify);
  eleventyConfig.addFilter("getSimilarPosts", getSimilarPosts);
  eleventyConfig.addFilter("filterOwnWebmentions", filterOwnWebmentions);
  eleventyConfig.addFilter("filterOwnWebmentions", filterOwnWebmentions);
  eleventyConfig.addFilter("getWebmentionsByUrl", getWebmentionsByUrl);
  eleventyConfig.addFilter("webmentionsByType", webmentionsByType);

  /* Markdown */
  eleventyConfig.setLibrary("md", markdownIt(mdOptions).use(markdownItAnchor, mdAnchorOpts));

  /* Plugins */
  eleventyConfig.addPlugin(pluginTOC);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(timeToRead);
  eleventyConfig.addPlugin(PostCSSPlugin);
  eleventyConfig.addPlugin(postGraph, { limit: 1, sort: "desc", noLabels: true, noStyles: true });

  /** Collections */
  eleventyConfig.addCollection("blog", getBlogPosts);
  eleventyConfig.addCollection("postsByYear", getPostsByYear);
  eleventyConfig.addCollection("frequentTags", getFrequentTags);
  eleventyConfig.addCollection("frequentTagsByYear", getFrequentTagsByYear);
  eleventyConfig.addCollection("gameAmountByStatus", gameAmountByStatus);
  eleventyConfig.addCollection("comicsAmountByStatus", comicsAmountByStatus);
  eleventyConfig.addCollection("filmsAmountByStatus", filmsAmountByStatus);
  eleventyConfig.addCollection("popularPosts", getPopularPosts);
  eleventyConfig.addCollection("gamesByLastPlayed", getGamesByLastPlayed);
  eleventyConfig.addCollection("gamesByYear", getGamesByYear);

  /** Events */
  eleventyConfig.on("beforeBuild", processThumbs);

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
