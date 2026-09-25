export default {
  commit: {
    ref: process.env.COMMIT_REF || null,
    url: process.env.REPOSITORY_URL,
  },
  title: "gary.place",
  description: "A digital workshop featuring tech, art and game development.",
  url: "https://gary.place",
  feedUrl: "https://gary.place/feed.xml",
  author: {
    name: "Gary Cuétara",
    email: "",
  },
  social: {
    bsky: "https://bsky.app/profile/gary.place",
    tumblr: "https://kulugary.tumblr.com/",
    mastodon: "https://tilde.zone/@gary",
    itch: "https://kulugary.itch.io/",
    github: "https://github.com/KuluGary",
  },
};
