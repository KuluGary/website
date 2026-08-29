export default {
  layout: "blog-post.html",
  category: "journal",
  permalink: ({ draft, page }) => (draft ? `/drafts/${page.fileSlug}/` : `journal/${page.fileSlug}/`),
  eleventyComputed: {
    eleventyExcludeFromCollections: ({ draft }) => (draft ? true : undefined),
    ignore: ({ draft }) => (draft ? true : undefined),
  },
};
