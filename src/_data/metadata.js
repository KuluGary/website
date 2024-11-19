module.exports = {
  commit: {
    ref: process.env.COMMIT_REF || null,
    url: process.env.REPOSITORY_URL,
  },
  title: "KuluGary's site",
  description: "An old web personal site",
  url: "https://kulugary.neocities.org",
  feedUrl: "https://kulugary.neocities.org/blog/feed.xml",
  author: {
    name: "Gary Cuétara",
    email: "",
  },
};
