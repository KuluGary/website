import { chunk } from "../helpers/array.js";
import { getAllBlogPosts, getBlogPosts } from "./blog.js";
import { getAllJournalPosts, getJournalPosts } from "./journal.js";
import { getNewsletterPosts } from "./newsletter.js";

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
 * Creates paginated post tag pages - flattens double pagination into single layer
 * Each entry represents one page of one tag
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<Object>} Flattened array of tag pages with their posts
 */
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
