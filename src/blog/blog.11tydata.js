import { getLang, getPostSlug, DEFAULT_LANG } from "../js/i18n.js";

export default {
  layout: "blog-post.html",
  category: "blog",
  eleventyComputed: {
    lang: ({ lang, page }) => getLang(page, lang),
    postSlug: ({ page }) => getPostSlug(page),
    permalink: ({ draft, lang, page }) => {
      const baseUrl = draft ? "/drafts" : "/blog";
      const postSlug = getPostSlug(page);
      const postLang = getLang(page, lang);
      const langSegment = postLang === DEFAULT_LANG ? "" : `${postLang}/`;

      return `${baseUrl}/${postSlug}/${langSegment}`;
    },
    eleventyExcludeFromCollections: ({ draft }) =>
      draft && process.env.ENVIRONMENT === "PRODUCTION" ? true : undefined,
    ignore: ({ draft }) => (draft ? true : undefined),
  },
};
