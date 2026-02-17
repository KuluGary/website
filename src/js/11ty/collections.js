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
        (a, b) => new Date(b.metadata.lastPlayed).getTime() - new Date(a.metadata.lastPlayed).getTime()
      ),
    }));
}
