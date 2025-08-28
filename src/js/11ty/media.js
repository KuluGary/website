module.exports = {
  removeUnsafeManga,
  getRecentActivity,
  getFrequentMediaTags,
  getMediaCategories,
  getMediaGenres,
};

/**
 * Removes manga when rating is not `safe`
 * @param {Array<Object>} mangaList A list manga objects
 * @returns An array of manga without those not tagged `safe`
 */
function removeUnsafeManga(mangaList) {
  return mangaList.filter((manga) => manga.rating === "safe");
}

/**
 * Gets an array of media and post elements sorted by date
 * @param {Object} collection - Eleventy API Object
 * @returns An array of media and posts
 */
function getRecentActivity(collection) {
  const allCollections = collection.getAll()[0].data;
  const posts = collection.getFilteredByTag("blog-post");

  const games = allCollections.games || [];
  // const manga = allCollections.manga || [];
  const movies = allCollections.movies || [];
  // const music = allCollections.music || [];
  const shows = allCollections.shows || [];
  const videos = allCollections.videos || [];
  const webcomics = allCollections.webcomics || [];
  const status = allCollections.status.entry || [];

  function getDate(element) {
    return (
      element.addedAt ||
      element.updatedAt ||
      element.completedAt ||
      element.createdAt ||
      element.data.date
    );
  }

  function formatMedia(media) {
    return media.map((element) => ({
      id: element.id,
      type: element.type,
      title: element?.latestItemTitle ?? element.title,
      link: element.link,
      tags: element.genres ?? element.tags ?? [],
      thumbnail: element.thumbnail,
      author: element.author,
      platform: element.platform,
      views: element.views,
      rate: element.rate,
      date: getDate(element),
      playtime: element.playtime,
      description: element.description,
    }));
  }

  function formatPosts(posts) {
    return posts.map((element) => ({
      id: element.id,
      type: "Post",
      title: element.data.title,
      link: element.url,
      date: element.date,
      tags: element.data.tags.filter((tag) => tag !== "blog-post"),
      author: { name: "Gary" },
      description: element.data.description,
      post: element,
    }));
  }

  function formatStatus(status) {
    return status.map((element) => ({
      id: element.id,
      type: "Status",
      date: element.published,
      link: element.link["@_href"],
      title: element.title,
    }));
  }

  const recentActivity = [...formatPosts(posts), ...formatStatus(status)].sort(
    (a, b) => {
      const prevDate = new Date(a.date);
      const nextDate = new Date(b.date);

      return nextDate.getTime() - prevDate.getTime();
    }
  );

  return recentActivity;
}

/**
 * Gets an array of tags sorted by frequency
 * @param {Object} media - Media object
 * @returns An array of sorted tags
 */
function getFrequentMediaTags(media) {
  const tagCount = {};

  for (const category of Object.values(media)) {
    for (const element of category) {
      for (const tag of element.genres) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
  }

  const sortedTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1]) // sort by frequency descending
    .map((entry) => ({ tag: entry[0], count: entry[1] }));

  return sortedTags;
}

/**
 * Gets a collection of media elements by category
 * @param {Object} collectionApi - Eleventy API Object
 * @returns An array of categories based on media
 */
function getMediaCategories(collectionApi) {
  const allMedia = collectionApi.getAll()[0]?.data;
  const categoryMap = {};

  for (const [mediaType, lists] of Object.entries(allMedia)) {
    for (const [category, list] of Object.entries(lists)) {
      if (!Array.isArray(list)) continue;

      for (const item of list) {
        if (!item.type) continue;
        const key = `${mediaType}:${category}`;

        if (!categoryMap[key]) {
          categoryMap[key] = {
            mediaType,
            category,
            items: [],
          };
        }

        categoryMap[key].items.push(item);
      }
    }
  }

  const categoryList = Object.values(categoryMap);

  return categoryList;
}

/**
 * Gets a collection of media elements by genre
 * @param {Object} collectionApi - Eleventy API Object
 * @returns An array of media elements by genre
 */
function getMediaGenres(collectionApi) {
  const allMedia = collectionApi.getAll()[0].data;

  const genreMap = {};
  for (const [mediaType, lists] of Object.entries(allMedia)) {
    for (const list of Object.values(lists)) {
      if (!Array.isArray(list)) continue;

      for (const item of list) {
        if (!item.genres) continue;

        for (const genre of item.genres) {
          const key = `${mediaType}:${genre}`;

          if (!genreMap[key]) {
            genreMap[key] = {
              mediaType,
              genre,
              items: [],
            };
          }
          genreMap[key].items.push(item);
        }
      }
    }
  }

  const genreList = Object.values(genreMap);

  return genreList;
}
