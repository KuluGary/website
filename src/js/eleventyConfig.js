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
  return DateTime.fromJSDate(date, {
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

function log(any) {
  console.log(any);
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
  log,
};
