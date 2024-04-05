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

module.exports = { articlesByYear, formatDate, filterMangaOnlySafe };
