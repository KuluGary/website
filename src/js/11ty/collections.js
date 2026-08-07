import Eleventy from "@11ty/eleventy";
import { getFromCache, setIntoCache } from "../cache.js";

/**
 * Returns a collection of all the blog posts inside md/blog
 * @param {Eleventy.collection} collectionApi
 * @returns a list of blog posts
 */
export function getBlogPosts(collectionApi) {
  return collectionApi.getFilteredByGlob("src/blog/**/index.md");
}

/**
 * Returns a collection of all the journal posts inside md/journal
 * @param {Eleventy.collection} collectionApi
 * @returns a list of journal posts
 */
export function getJournalPosts(collectionApi) {
  return collectionApi.getFilteredByGlob("src/journal/**/index.md");
}

/**
 * Returns a collection of all the art posts inside md/art
 * @param {Eleventy.collection} collectionApi
 * @returns a list of art posts
 */
export function getArtPosts(collectionApi) {
  return collectionApi.getFilteredByGlob("src/art/**/index.md");
}

/**
 * Returns a collection of all the review posts inside md/reviews
 * @param {Eleventy.collection} collectionApi
 * @returns a list of review posts
 */
export function getReviewPosts(collectionApi) {
  return collectionApi.getFilteredByGlob("src/reviews/**/index.md");
}

/**
 * Returns all markdown posts
 * @param {Eleventy.collection} collectionApi
 * @return a list of posts
 */
export function getAllPosts(collectionApi) {
  const blog = getBlogPosts(collectionApi);
  const journal = getJournalPosts(collectionApi);
  const reviews = getGamesWithReviews(collectionApi);

  return [...blog, ...journal, ...reviews].sort((a, b) => a.date < b.date);
}

/**
 * Groups all blog posts by year
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<{ year: number, items: Array<Object> }>}
 */
export function getPostsByYear(collectionApi) {
  const posts = getBlogPosts(collectionApi);

  const grouped = posts.reduce((acc, post) => {
    const year = post.date.getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort((a, b) => b[0] - a[0])
    .map(([year, posts]) => ({
      year: Number(year),
      items: posts.sort((a, b) => b.date - a.date),
    }));
}

/**
 * Returns the amount of games by status
 * @param {Eleventy.collection} collectionApi
 * @returns an object with the status and the amount of times it appears
 */
export function gameAmountByStatus(collectionApi) {
  const cached = getFromCache("gameAmountByStatus");

  if (cached) return cached;

  const allGames = collectionApi.getAll()[0].data.games;

  const gameAmountByStatus = allGames.reduce((acc, curr) => {
    const currCategory = curr.status;

    if (acc[currCategory]) {
      acc[currCategory] += 1;
    } else {
      acc[currCategory] = 1;
    }

    return acc;
  }, {});

  setIntoCache("gameAmountByStatus", gameAmountByStatus);

  return gameAmountByStatus;
}

/**
 * Returns the amount of manga + webcomics by status
 * @param {Eleventy.collection} collectionApi
 * @returns an object with the status and the amount of times it appears
 */
export function comicsAmountByStatus(collectionApi) {
  const cached = getFromCache("comicsAmountByStatus");

  if (cached) return cached;

  const allManga = collectionApi.getAll()[0]?.data.manga;
  const allWebcomics = collectionApi.getAll()[0]?.data.webcomics;

  const status = {};

  function cb(element, key) {
    if (status[element.status]) {
      if (status[element.status][key]) {
        status[element.status][key] += 1;
      } else {
        status[element.status][key] = 1;
      }
    } else {
      status[element.status] = { [key]: 1 };
    }
  }

  allManga.forEach((element) => cb(element, "manga"));
  allWebcomics.forEach((element) => cb(element, "webcomics"));

  setIntoCache("comicsAmountByStatus", status);

  return status;
}

/**
 * Returns the amount of movies + tv shows by status
 * @param {Eleventy.collection} collectionApi
 * @returns an object with the status and the amount of times it appears
 */
export function filmsAmountByStatus(collectionApi) {
  const cached = getFromCache("filmsAmountByStatus");

  if (cached) return cached;

  const allShows = collectionApi.getAll()[0]?.data.shows;
  const allMovies = collectionApi.getAll()[0]?.data.movies;

  const status = {};

  function cb(element, key) {
    if (status[element.status]) {
      if (status[element.status][key]) {
        status[element.status][key] += 1;
      } else {
        status[element.status][key] = 1;
      }
    } else {
      status[element.status] = { [key]: 1 };
    }
  }

  allShows.forEach((element) => cb(element, "movies"));
  allMovies.forEach((element) => cb(element, "shows"));

  setIntoCache("filmsAmountByStatus", status);

  return status;
}

/**
 * Return the most used tags in all posts
 * @param {Array<Object>} posts - A list of posts with tags
 * @returns An array of tags sorted by frequency
 */
export function getFrequentTags(collectionApi) {
  const posts = getBlogPosts(collectionApi);
  const tagCount = {};

  for (const post of posts) {
    if (!Array.isArray(post.data.tags)) continue;

    for (const tag of post.data.tags) {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    }
  }

  const sortedTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => ({ tag: entry[0], count: entry[1] }));

  return sortedTags;
}

/**
 * Returns the most used tags for each year
 * @param {Eleventy.collection} collectionApi
 * @returns An object with tags grouped by year
 */
export function getFrequentTagsByYear(collectionApi) {
  const postsByYear = getPostsByYear(collectionApi);
  const tagCount = {};

  for (const { year, items } of postsByYear) {
    tagCount[year] = {};

    for (const post of items) {
      if (!Array.isArray(post.data.tags)) continue;

      for (const tag of post.data.tags) {
        if (tag in tagCount[year]) {
          tagCount[year][tag] += 1;
        } else {
          tagCount[year][tag] = 1;
        }
      }
    }
  }

  return tagCount;
}

/**
 * Returns the most popular blog posts based on webmention count
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<Object>} Sorted list of blog posts by popularity
 */
export function getPopularPosts(collectionApi) {
  const posts = getBlogPosts(collectionApi);
  const webmentions = collectionApi.getAll()[0]?.data.webmentions || [];

  // Attach popularity to posts using 'includes' match
  const postsWithPopularity = posts.map((post) => {
    const url = post.url;
    const popularity = webmentions.filter((wm) => wm["wm-target"] && wm["wm-target"].includes(url)).length;

    return {
      title: post.data.title,
      url: url,
      date: post.date,
      popularity,
      description: post.data.description,
    };
  });

  return postsWithPopularity.sort((a, b) => b.popularity - a.popularity);
}

/**
 * Returns the list of games ordered by last played
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<Object>} Sorted list of games by last played
 */
export function getGamesByLastPlayed(collectionApi) {
  const allGames = collectionApi.getAll()[0].data.games;

  return allGames.sort((a, b) => {
    const aLast = a?.metadata?.lastPlayed;
    const bLast = b?.metadata?.lastPlayed;

    if (aLast == null && bLast == null) return 0;

    if (aLast == null) return 1;
    if (bLast == null) return -1;

    const aLastTimestamp = new Date(aLast).getTime();
    const bLastTimestamp = new Date(bLast).getTime();

    return bLastTimestamp - aLastTimestamp;
  });
}

/**
 * Returns the list of games grouped by year
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<Object>} List of games grouped by year
 */
export function getGamesByYear(collectionApi) {
  const allGames = collectionApi.getAll()[0].data.games;

  const grouped = allGames.reduce((acc, game) => {
    const lastPlayed = game.metadata?.lastPlayed;

    if (!lastPlayed) return acc;

    const year = new Date(lastPlayed).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(game);
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort((a, b) => b[0] - a[0])
    .map(([year, games]) => ({
      year: Number(year),
      items: games.sort(
        (a, b) => new Date(b.metadata.lastPlayed).getTime() - new Date(a.metadata.lastPlayed).getTime(),
      ),
    }));
}

/**
 * Returns a list of the blog posts in the blogroll
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<Object>} List of all blog posts in the blogroll
 */
export function getFeaturedBlogPosts(collectionApi) {
  const allBlogs = collectionApi.getAll()[0].data.blogroll;

  const allBlogPosts = allBlogs.reduce((acc, curr) => {
    const blogPosts = curr.blog_posts;

    acc = acc.concat(blogPosts);

    return acc;
  }, []);

  return allBlogPosts;
}

/**
 * Returns a list of games with their associated reviewws
 * @param {Eleventy.collection} collectionApi
 * @returns {Array<Object>} List of all games with their reviews
 */
export function getGamesWithReviews(collectionApi) {
  const allReviews = getReviewPosts(collectionApi);
  const allGames = getGamesByLastPlayed(collectionApi);

  const gamesWithReviews = [];

  for (const game of allGames) {
    const gameId = game.id;

    const review = allReviews.find((review) => review.data.entityId === gameId);

    if (review) {
      gamesWithReviews.push({ ...game, review });
    }
  }

  return gamesWithReviews;
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
