import pluginRss from "@11ty/eleventy-plugin-rss";
import PostCSSPlugin from "@jgarber/eleventy-plugin-postcss";
import syntaxHighlight from "@pborenstein/eleventy-md-syntax-highlight";
import subsetting from "@photogabble/eleventy-plugin-font-subsetting";
import postGraph from "@rknightuk/eleventy-plugin-post-graph";
import dotenv from "dotenv";
import {
  getAllBlogPosts,
  getAllJournalPosts,
  getAllPosts,
  getAllPostsWithTranslations,
  getBlogPosts,
  getBlogTagPages,
  getJournalPosts,
  getJournalTagPages,
  getPostTagPages,
} from "./src/js/11ty/collections.js";
import {
  filterByLang,
  filterOwnWebmentions,
  formatDate,
  formatDuration,
  getTranslations,
  getWebmentionsByUrl,
  limit,
  optimizeRssImages,
  pad,
  slice,
  sortByDate,
  split,
  unslugify,
  webmentionsByType,
} from "./src/js/11ty/filters.js";
import { generateGallery, generateImage } from "./src/js/11ty/shortcodes.js";
import mdIt from "./src/js/lib/markdown-it.js";

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
  eleventyConfig.addFilter("getTranslations", getTranslations);
  eleventyConfig.addFilter("filterOwnWebmentions", filterOwnWebmentions);
  eleventyConfig.addFilter("getWebmentionsByUrl", getWebmentionsByUrl);
  eleventyConfig.addFilter("webmentionsByType", webmentionsByType);
  eleventyConfig.addFilter("rssImages", optimizeRssImages);

  /* Markdown */
  eleventyConfig.setLibrary("md", mdIt);

  /** Shortcodes */
  eleventyConfig.addPairedNunjucksAsyncShortcode("gallery", generateGallery);
  eleventyConfig.addPairedNunjucksAsyncShortcode("image", generateImage);

  /* Plugins */
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(PostCSSPlugin);
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
      "./src/assets/fonts/ZenKurenaido-Regular.ttf",
    ],
  });
  eleventyConfig.addPlugin(pluginRss);

  /** Collections */
  eleventyConfig.addCollection("blog", getBlogPosts);
  eleventyConfig.addCollection("blogAll", getAllBlogPosts);
  eleventyConfig.addCollection("blogTagPages", getBlogTagPages);
  eleventyConfig.addCollection("journal", getJournalPosts);
  eleventyConfig.addCollection("journalAll", getAllJournalPosts);
  eleventyConfig.addCollection("journalTagPages", getJournalTagPages);
  eleventyConfig.addCollection("posts", getAllPosts);
  eleventyConfig.addCollection("postsWithTranslations", getAllPostsWithTranslations);
  eleventyConfig.addCollection("postTagPages", getPostTagPages);

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
