const readingTime = require("reading-time");

module.exports = {
  getPostsByYear,
  getShareUrl,
  getUniqueTags,
  getCollectionStats,
  getPostsWithoutCurrent,
  getFrequentTags,
  getSimilarPosts,
  getWebmentionsByUrl,
  isOwnWebmention,
  size,
  webmentionsByType,
  readableDateFromISO,
};

/**
 * Groups blog posts by year in descending order.
 *
 * @param {Object} collection - The Eleventy collection API object.
 * @param {Function} collection.getFilteredByTag - A method to retrieve items filtered by tag.
 * @returns {Array<[number, Array<Object>]>} An array of tuples, each containing a year and the list of posts from that year.
 */
function getPostsByYear(collection) {
  const posts = collection.getFilteredByTag("blog-post").reverse();
  const years = posts.map((post) => post.date.getFullYear());
  const uniqueYears = [...new Set(years)];

  const postsByYear = uniqueYears.reduce((prev, year) => {
    const filteredposts = posts.filter((post) => post.date.getFullYear() === year);

    return [...prev, [year, filteredposts]];
  }, []);

  return postsByYear;
}

/**
 * Generates a social media share URL for a given site with the provided metadata.
 *
 * @param {string} pageUrl - The URL of the page to share.
 * @param {"twitter" | "tumblr" | "reddit"} site - The social media platform to generate the share URL for.
 * @param {string} title - The title or text to accompany the shared link.
 * @param {string[]} tags - An array of tags or hashtags to include in the share (used by Twitter and Tumblr).
 * @returns {URL} A URL object representing the share link for the specified platform.
 */
function getShareUrl(pageUrl, site, title, tags) {
  let url = "";

  switch (site) {
    case "twitter":
      const twitterUrl = new URL("https://twitter.com/intent/tweet/");
      twitterUrl.searchParams.append("url", pageUrl);
      twitterUrl.searchParams.append("text", title);
      twitterUrl.searchParams.append("hashtags", tags.join(","));

      url = twitterUrl;
      break;
    case "tumblr":
      const tumblrUrl = new URL("http://tumblr.com/widgets/share/tool");
      tumblrUrl.searchParams.append("posttype", "link");
      tumblrUrl.searchParams.append("canonicalUrl", pageUrl);
      tumblrUrl.searchParams.append("title", title);
      tumblrUrl.searchParams.append("tags", tags.join(","));

      url = tumblrUrl;
      break;
    case "reddit":
      const redditUrl = new URL("https://reddit.com/submit");
      redditUrl.searchParams.append("url", pageUrl);
      redditUrl.searchParams.append("title", title);

      url = redditUrl;
      break;
    case "bluesky":
      const bskyUrl = new URL("https://bsky.app/intent/compose");
      bskyUrl.searchParams.append("text", `${title}: ${pageUrl}`);

      url = bskyUrl;
      break;
  }

  return url;
}

/**
 * Extracts a list of unique tags from a collection of posts.
 *
 * @param {Array<Object>} [collections=[]] - An array of post objects, each optionally containing a `data.tags` array.
 * @returns {string[]} An array of unique tag names.
 */
function getUniqueTags(collections = []) {
  let tags = new Set();

  for (const post of collections) {
    if (!post.data || !post.data.tags) continue;

    for (const tag of post.data.tags) {
      tags.add(tag);
    }
  }
  return [...tags];
}

/**
 * Returns an object with calculated stats from an Eleventy collection.
 * @param {Object} collection - The Eleventy collection API object.
 * @returns {Object<{ totalWords: number, totalItems: number, firstItem: Object, longestItem: Object<{ wordCount: number, item: Object }>, byYear: Map }>}
 */
function getCollectionStats(collection) {
  const numberFormatter = new Intl.NumberFormat("en-GB", {
    maximumSignificantDigits: 3,
  });

  const stats = collection.reduce(
    (stats, item) => {
      stats.totalItems++;
      if (stats.firstItem === null) stats.firstItem = item;

      const itemStats = readingTime(item.templateContent);
      const wordCount = itemStats.words;

      if (wordCount > stats.longestItem.wordCount) {
        stats.longestItem.wordCount = wordCount;
        stats.longestItem.item = item;
      }

      stats.totalWords += wordCount;

      // Year stats
      const year = item.date.getFullYear();
      const yearStats = stats.byYear.get(year) ?? {
        year,
        totalWords: 0,
        totalItems: 0,
      };

      yearStats.totalItems++;
      yearStats.totalWords += wordCount;

      stats.byYear.set(year, yearStats);

      return stats;
    },
    {
      totalWords: 0,
      totalItems: 0,
      firstItem: null,
      longestItem: {
        wordCount: 0,
        item: null,
      },
      byYear: new Map(),
    }
  );

  stats.avgWords = stats.totalItems > 0 ? numberFormatter.format(stats.totalWords / stats.totalItems) : 0;

  stats.totalWords = numberFormatter.format(stats.totalWords);
  stats.totalItems = numberFormatter.format(stats.totalItems);
  stats.longestItem.wordCount = numberFormatter.format(stats.longestItem.wordCount);

  stats.byYear = Array.from(stats.byYear.values())
    .map((year) => {
      return {
        ...year,
        totalWords: numberFormatter.format(year.totalWords),
        totalItems: numberFormatter.format(year.totalItems),
        avgWords: year.totalItems > 0 ? numberFormatter.format(year.totalWords / year.totalItems) : 0,
      };
    })
    .sort((a, b) => a.year - b.year);

  return stats;
}

/**
 * Return the most used tags in all posts
 * @param {Array<Object>} posts - A list of posts with tags
 * @returns An array of tags sorted by frequency
 */
function getFrequentTags(posts) {
  const tagCount = {};

  for (const post of posts) {
    if (Array.isArray(post.data.tags)) {
      for (const tag of post.data.tags) {
        if (tag !== "blog-post") tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
  }

  const sortedTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1]) // sort by frequency descending
    .map((entry) => ({ tag: entry[0], count: entry[1] }));

  return sortedTags;
}

/**
 * Returns a list of posts excluding the current one
 * @param {Array<Object>} collection - An array of post objects
 * @param {Object} page current page
 * @returns An array of posts excluding the current
 */
function getPostsWithoutCurrent(collection, page) {
  return collection.filter((post) => post.url !== page.url);
}

/**
 * Filters categories based on two arrays
 * @param {Array<string>} categoriesA
 * @param {Array<string>} categoriesB
 * @returns An array of tags
 */
function _getSimilarCategories(categoriesA, categoriesB) {
  return categoriesA.filter(Set.prototype.has, new Set(categoriesB)).length;
}

/**
 * Gets posts with similar content based on tags
 * @param {Array<Object>} collection - An array of post objects
 * @param {string} path - The current URL route
 * @param {Array<string>} categories - Current tags
 * @returns A list of posts ordered by similarity
 */
function getSimilarPosts(collection, path, categories) {
  return collection
    .filter((post) => {
      return _getSimilarCategories(post.data.tags, categories) >= 1 && post.data.page.url !== path;
    })
    .sort((a, b) => {
      return _getSimilarCategories(b.data.tags, categories) - _getSimilarCategories(a.data.tags, categories);
    });
}

function getWebmentionsByUrl(webmentions, url) {
  console.log(url);
  return webmentions.filter((entry) => entry["wm-target"] === url);
}

function isOwnWebmention(webmention) {
  const urls = ["https://sia.codes", "https://twitter.com/thegreengreek"];

  const authorUrl = webmention.author ? webmention.author.url : false;

  // check if a given URL is part of this site.

  return authorUrl && urls.includes(authorUrl);
}

function size(mentions) {
  return !mentions ? 0 : mentions.length;
}

function webmentionsByType(mentions, mentionType) {
  return mentions.filter((entry) => entry["wm-property"] === mentionType);
}

function readableDateFromISO(dateStr, formatStr = "dd LLL yyyy 'at' hh:mma") {
  return DateTime.fromISO(dateStr).toFormat(formatStr);
}
