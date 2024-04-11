function articlesByYear(collection) {
  const articles = collection.getFilteredByTag("article").reverse();
  const years = articles.map((post) => post.date.getFullYear());
  const uniqueYears = [...new Set(years)];

  const articlesByYear = uniqueYears.reduce((prev, year) => {
    const filteredArticles = articles.filter((post) => post.date.getFullYear() === year);

    return [...prev, [year, filteredArticles]];
  }, []);

  return articlesByYear;
}

function formatDate(dateObj) {
  const formatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

  return formatter.format(dateObj);
}

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

module.exports = { articlesByYear, formatDate, filterMangaOnlySafe, generateShareUrl };
