import { getLang, getPostSlug, DEFAULT_LANG, getPostLayout } from "../js/i18n.js";

export default {
  category: "blog",
  css: ["/css/reset.css", "/css/variables.css", "/css/layouts/base.css", "/css/pages/post.css"],
  eleventyComputed: {
    lang: ({ lang, page }) => getLang(page, lang),
    postSlug: ({ page }) => getPostSlug(page),
    layout: ({ page, lang }) => {
      const language = getLang(page, lang);

      return getPostLayout(language);
    },
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
