export default {
  layout: "blog-post.html",
  category: "blog",
  permalink: ({ draft, page }) => (draft ? `/drafts/${page.fileSlug}/` : `blog/${page.fileSlug}/`),
  eleventyComputed: {
    eleventyExcludeFromCollections: ({ draft }) => (draft ? true : undefined),
    ignore: ({ draft }) => (draft ? true : undefined),
  },
};
