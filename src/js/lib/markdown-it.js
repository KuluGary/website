import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItAttrs from "markdown-it-attrs";
import string from "string";
import { generateCodeBlocks, generateLinks } from "../11ty/renderers.js";

const slugify = (s) => string(s).slugify().toString();

const mdIt = new markdownIt({
  html: true,
  breaks: false,
})
  .disable("code")
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      symbol: "#",
      class: "anchor-link",
    }),
    level: [1, 2, 3, 4],
    slugify,
  })
  .use(markdownItAttrs, {
    leftDelimiter: "{",
    rightDelimiter: "}",
    allowedAttributes: ["id", "class", /^data-.*$/],
  })
  .use(generateCodeBlocks)
  .use(generateLinks);

export default mdIt;
