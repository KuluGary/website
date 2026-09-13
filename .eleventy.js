import pluginRss from "@11ty/eleventy-plugin-rss";
import PostCSSPlugin from "@jgarber/eleventy-plugin-postcss";
import syntaxHighlight from "@pborenstein/eleventy-md-syntax-highlight";
import postGraph from "@rknightuk/eleventy-plugin-post-graph";
import dotenv from "dotenv";
import timeToRead from "eleventy-plugin-time-to-read";
import subsetting from "@photogabble/eleventy-plugin-font-subsetting";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import pluginTOC from "eleventy-plugin-toc";
import {
  gameAmountByStatus,
  getAllBlogPosts,
  getAllPosts,
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
  filterByLang,
  filterOwnWebmentions,
  formatDate,
  formatDuration,
  getSimilarPosts,
  getTranslations,
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
import { generateGallery, generateImage } from "./src/js/11ty/shortcodes.js";

dotenv.config();

export default async function (eleventyConfig) {
  eleventyConfig.addGlobalData("rootURL", process.env.ROOT_URL);
  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("./src/assets");
  eleventyConfig.addPassthroughCopy("./src/blog/**/assets");
  eleventyConfig.addPassthroughCopy("./src/journal/**/assets");

  eleventyConfig.addWatchTarget("./src/css");
  eleventyConfig.addWatchTarget("./src/js");
  eleventyConfig.addWatchTarget("./src/blog/**/*.md");
  eleventyConfig.addWatchTarget("./src/journal/**/*.md");
  eleventyConfig.addWatchTarget("./src/art/**/*.md");
  eleventyConfig.addWatchTarget("./src/data");

  /** Filters */
  eleventyConfig.addFilter("formatDate", formatDate);
  eleventyConfig.addFilter("formatDuration", formatDuration);
  eleventyConfig.addFilter("filterByLang", filterByLang);
  eleventyConfig.addFilter("limit", limit);
  eleventyConfig.addFilter("sortByDate", sortByDate);
  eleventyConfig.addFilter("slice", slice);
  eleventyConfig.addFilter("split", split);
  eleventyConfig.addFilter("pad", pad);
  eleventyConfig.addFilter("unslugify", unslugify);
  eleventyConfig.addFilter("getSimilarPosts", getSimilarPosts);
  eleventyConfig.addFilter("getTranslations", getTranslations);
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

  /** Shortcodes */
  eleventyConfig.addPairedNunjucksAsyncShortcode("gallery", generateGallery);
  eleventyConfig.addPairedNunjucksAsyncShortcode("image", generateImage);

  /* Plugins */
  eleventyConfig.addPlugin(pluginTOC);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(timeToRead);
  eleventyConfig.addPlugin(PostCSSPlugin);
  // eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
  //   formats: ["avif", "webp", "jpeg", "gif"],
  //   sharpOptions: {
  //     animated: true,
  //   },
  // });
  eleventyConfig.addPlugin(postGraph, {
    limit: 1,
    sort: "desc",
    noLabels: true,
    noStyles: true,
  });
  eleventyConfig.addPlugin(subsetting, {
    enabled: process.env.ELEVENTY_ENV !== "production",
    dist: "_site/assets/fonts",
    srcFiles: [
      "./src/assets/fonts/PatrickHandSC-Regular.ttf",
      "./src/assets/fonts/MapleMono-CN-Regular.ttf",
      "./src/assets/fonts/MapleMono-Italic.woff2",
      "./src/assets/fonts/MapleMono-Bold.woff2",
      "./src/assets/fonts/MapleMono-Thin.woff2",
      "./src/assets/fonts/MapleMono-ThinItalic.woff2",
    ],
  });
  eleventyConfig.addPlugin(pluginRss);

  /** Collections */
  eleventyConfig.addCollection("blog", getBlogPosts);
  eleventyConfig.addCollection("blogAll", getAllBlogPosts);
  eleventyConfig.addCollection("journal", getJournalPosts);
  eleventyConfig.addCollection("art", getArtPosts);
  eleventyConfig.addCollection("posts", getAllPosts);
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
