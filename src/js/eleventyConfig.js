const readingTime = require("reading-time");
const { DateTime } = require("luxon");

function postsByYear(collection) {
  const posts = collection.getFilteredByTag("blog-post").reverse();
  const years = posts.map((post) => post.date.getFullYear());
  const uniqueYears = [...new Set(years)];

  const postsByYear = uniqueYears.reduce((prev, year) => {
    const filteredposts = posts.filter((post) => post.date.getFullYear() === year);

    return [...prev, [year, filteredposts]];
  }, []);

  return postsByYear;
}

const formatDate = (date, format = "dd/LL/yyyy") => {
  return DateTime.fromJSDate(typeof date === "string" ? new Date(date) : date, {
    zone: "utc",
  }).toFormat(String(format));
};

function filterMangaOnlySafe(mangaList) {
  return mangaList.filter((manga) => manga.rating === "safe");
}

function generateShareUrl(pageUrl, site, title, tags) {
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
  }

  return url;
}

function uniqueTags(collections = []) {
  let tags = new Set();

  for (const post of collections) {
    if (post.data && post.data.tags) {
      for (const tag of post.data.tags) {
        tags.add(tag);
      }
    }
  }
  return [...tags];
}

function unslugify(slug) {
  return slug
    .toLowerCase()
    .split(/[-_.\s]/)
    .map((w) => `${w.charAt(0).toUpperCase()}${w.substr(1)}`)
    .join(" ");
}

function generateSocialMediaImage(imageSrc) {
  if (!imageSrc) return `https://kulugary.neocities.org/assets/images/textures/social-share.jpg`;

  if (imageSrc.startsWith("https://")) return imageSrc;

  return `https://kulugary.neocities.org${imageSrc}`;
}

function limit(array, limit = 0) {
  return array.slice(0, limit);
}

const collectionStats = (collection) => {
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

  // Number formatting

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
};

function excludeFromList(collection, page) {
  return collection.filter((post) => post.url !== page.url);
}

function getSimilarCategories(categoriesA, categoriesB) {
  return categoriesA.filter(Set.prototype.has, new Set(categoriesB)).length;
}

function getSimilarPosts(collection, path, categories) {
  return collection
    .filter((post) => {
      return getSimilarCategories(post.data.tags, categories) >= 1 && post.data.page.url !== path;
    })
    .sort((a, b) => {
      return getSimilarCategories(b.data.tags, categories) - getSimilarCategories(a.data.tags, categories);
    });
}

function getRecentMedia(collection) {
  const allMedia = collection.getAll()[0].data;
  const posts = collection.getFilteredByTag("blog-post");

  const games = allMedia.games || [];
  const manga = allMedia.manga || [];
  const movies = allMedia.movies || [];
  const music = allMedia.music || [];
  const shows = allMedia.shows || [];
  const videos = allMedia.videos || [];

  function getDate(element) {
    return element.addedAt || element.updatedAt || element.completedAt || element.createdAt || element.data.date;
  }

  const recentMedia = [
    ...games.favourites,
    ...movies.watchlist,
    ...manga.reading,
    ...shows.watchlist,
    ...music.favourites,
    ...videos.favourites,
    ...posts,
  ]
    .map((element) => {
      if (element.type) {
        return {
          id: element.id,
          type: element.type,
          title: element.title,
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
        };
      }

      return {
        id: element.id,
        type: "Post",
        title: element.data.title,
        link: element.url,
        date: element.date,
        tags: element.data.tags.filter((tag) => tag !== "blog-post"),
        author: { name: "Gary" },
        description: element.description,
        post: element,
      };
    })
    .sort((a, b) => {
      const prevDate = new Date(a.date);
      const nextDate = new Date(b.date);

      return nextDate.getTime() - prevDate.getTime();
    });

  return recentMedia;
}

function log(any) {
  console.log(any);
}

function formatNumber(number, notation) {
  const formatter = Intl.NumberFormat("en", { notation });
  return formatter.format(number);
}

function frequentTags(posts) {
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

function frequentMediaTags(media) {
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

function sortByDate(collection, key) {
  return collection.sort((a, b) => new Date(b[key]).getTime() - new Date(a[key]).getTime());
}

function addGenrePagesCollection(collectionApi) {
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

  return Object.values(genreMap);
}

module.exports = {
  postsByYear,
  formatDate,
  filterMangaOnlySafe,
  generateShareUrl,
  uniqueTags,
  unslugify,
  generateSocialMediaImage,
  limit,
  collectionStats,
  excludeFromList,
  getSimilarPosts,
  getRecentMedia,
  formatNumber,
  frequentTags,
  frequentMediaTags,
  sortByDate,
  addGenrePagesCollection,
  log,
};
