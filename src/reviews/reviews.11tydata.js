export default {
  layout: "blog-post.html",
  category: "reviews",
  permalink: ({ draft, page }) => (draft ? `/drafts/${page.fileSlug}/` : `/reviews/${page.fileSlug}/`),
  eleventyComputed: {
    eleventyExcludeFromCollections: ({ draft }) => (draft ? true : undefined),
    ignore: ({ draft }) => (draft ? true : undefined),
  },
};
