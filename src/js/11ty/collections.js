import Eleventy from "@11ty/eleventy";
import { getFromCache, setIntoCache } from "../cache.js";
import { getLang } from "../i18n.js";

const DEFAULT_LANG = "en";

function getPostLang(post) {
  if (post.data.lang) return post.data.lang;

  const inputPath = (post.inputPath || "").replace(/\\/g, "/");
  const fileName = inputPath.split("/").at(-1) || "";
  const fileSlug = fileName.replace(/\.[^.]+$/, "");

  return fileSlug === "index" ? DEFAULT_LANG : fileSlug;
}

/**
 * Returns all language variants of blog posts inside src/blog.
 * @param {Eleventy.collection} collectionApi
 * @returns a list of blog posts
 */
export function getAllBlogPosts(collectionApi) {
  return collectionApi.getFilteredByGlob("src/blog/**/*.md");
}

/**
 * Returns the default-language blog posts inside src/blog.
 * @param {Eleventy.collection} collectionApi
 * @returns a list of blog posts
 */
export function getBlogPosts(collectionApi) {
  return getAllBlogPosts(collectionApi).filter((post) => getPostLang(post) === DEFAULT_LANG);
}

/**
 * Returns all language variants of journal posts inside src/journal.
 * @param {Eleventy.collection} collectionApi
 * @returns a list of blog posts
 */
export function getAllJournalPosts(collectionApi) {
  return collectionApi.getFilteredByGlob("src/journal/**/*.md");
}

/**
 * Returns a collection of all the journal posts inside md/journal
 * @param {Eleventy.collection} collectionApi
 * @returns a list of journal posts
 */
export function getJournalPosts(collectionApi) {
  return getAllJournalPosts(collectionApi).filter((post) => getPostLang(post) == DEFAULT_LANG);
}

/**
 * Returns all markdown posts
 * @param {Eleventy.collection} collectionApi
 * @return a list of posts
 */
export function getAllPosts(collectionApi) {
  const blog = getBlogPosts(collectionApi);
  const journal = getJournalPosts(collectionApi);

  return [...blog, ...journal].sort((a, b) => b.date - a.date);
}

/**
 * Returns all markdown posts including translations
 * @param {Eleventy.collection} collectionApi
 * @return a list of posts
 */
export function getAllPostsWithTranslations(collectionApi) {
  const blog = getAllBlogPosts(collectionApi);
  const journal = getAllJournalPosts(collectionApi);

  return [...blog, ...journal].sort((a, b) => b.date - a.date);
}

/**
 * Helper function to chunk an array into smaller arrays
 * @param {Array} array - The array to chunk
 * @param {number} size - The size of each chunk
 * @returns {Array<Array>} Array of chunks
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Creates paginated blog tag pages - flattens double pagination into single layer
 * Each entry represents one page of one tag
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<Object>} Flattened array of tag pages with their posts
 */
export function getBlogTagPages(collectionApi) {
  const blogPosts = getBlogPosts(collectionApi);
  const paginationSize = 10;
  const tagMap = [];

  const uniqueTagSet = new Set();

  blogPosts.forEach((post) => {
    if (post.data.tags) {
      post.data.tags.forEach((tag) => {
        uniqueTagSet.add(tag);
      });
    }
  });

  const tagArray = [...uniqueTagSet];

  for (const tagName of tagArray) {
    const taggedPosts = blogPosts.filter((post) => post.data.tags && post.data.tags.includes(tagName));

    const sortedPosts = taggedPosts.sort((a, b) => b.date - a.date);

    const pagedItems = chunk(sortedPosts, paginationSize);

    for (let pageNumber = 0; pageNumber < pagedItems.length; pageNumber++) {
      tagMap.push({
        tagName: tagName,
        pageNumber: pageNumber,
        totalPages: pagedItems.length,
        pageData: pagedItems[pageNumber],
      });
    }
  }

  return tagMap;
}

/**
 * Creates paginated journal tag pages - flattens double pagination into single layer
 * Each entry represents one page of one tag
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<Object>} Flattened array of tag pages with their posts
 */
export function getJournalTagPages(collectionApi) {
  const journalPosts = getJournalPosts(collectionApi);
  const paginationSize = 10;
  const tagMap = [];

  const uniqueTagSet = new Set();

  journalPosts.forEach((post) => {
    if (post.data.tags) {
      post.data.tags.forEach((tag) => {
        uniqueTagSet.add(tag);
      });
    }
  });

  const tagArray = [...uniqueTagSet];

  for (const tagName of tagArray) {
    const taggedPosts = journalPosts.filter((post) => post.data.tags && post.data.tags.includes(tagName));

    const sortedPosts = taggedPosts.sort((a, b) => b.date - a.date);

    const pagedItems = chunk(sortedPosts, paginationSize);

    for (let pageNumber = 0; pageNumber < pagedItems.length; pageNumber++) {
      tagMap.push({
        tagName: tagName,
        pageNumber: pageNumber,
        totalPages: pagedItems.length,
        pageData: pagedItems[pageNumber],
      });
    }
  }

  return tagMap;
}

export function getPostTagPages(collectionApi) {
  const posts = getAllPosts(collectionApi);
  const paginationSize = 10;
  const tagMap = [];

  const uniqueTagSet = new Set();

  posts.forEach((post) => {
    if (post.data.tags) {
      post.data.tags.forEach((tag) => {
        uniqueTagSet.add(tag);
      });
    }
  });

  const tagArray = [...uniqueTagSet];

  for (const tagName of tagArray) {
    const taggedPosts = posts.filter((post) => post.data.tags && post.data.tags.includes(tagName));

    const sortedPosts = taggedPosts.sort((a, b) => b.date - a.date);

    const pagedItems = chunk(sortedPosts, paginationSize);

    for (let pageNumber = 0; pageNumber < pagedItems.length; pageNumber++) {
      tagMap.push({
        tagName: tagName,
        pageNumber: pageNumber,
        totalPages: pagedItems.length,
        pageData: pagedItems[pageNumber],
      });
    }
  }

  return tagMap;
}
