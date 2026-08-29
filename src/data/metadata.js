export default {
  commit: {
    ref: process.env.COMMIT_REF || null,
    url: process.env.REPOSITORY_URL,
  },
  title: "gary.place",
  description: "A digital workshop featuring tech, art and game development.",
  url: "https://kulugary.neocities.org",
  feedUrl: "https://kulugary.neocities.org/blog/feed.xml",
  author: {
    name: "Gary Cuétara",
    email: "",
  },
  social: {
    bsky: "https://bsky.app/profile/kulugary.itch.io",
    mastodon: "https://indiepocalypse.social/@kulugary",
    itch: "https://kulugary.itch.io/",
    github: "https://github.com/KuluGary",
  },
};
