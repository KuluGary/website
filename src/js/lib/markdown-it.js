import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItAttrs from "markdown-it-attrs";
import string from "string";

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
  .use(function (md) {
    const defaultFence =
      md.renderer.rules.fence ||
      function (tokens, idx, options, _, self) {
        return self.renderToken(tokens, idx, options);
      };

    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
      const token = tokens[idx];

      // Extract title="filename.ext"
      const match = token.info.match(/title="([^"]+)"/);
      const filename = match ? match[1] : null;

      // Remove title from info so highlighter still works correctly
      if (match) {
        token.info = token.info.replace(match[0], "").trim();
      }

      const rendered = defaultFence(tokens, idx, options, env, self);

      if (!filename) return rendered;

      return `
  <div class="code-block">
    <div class="code-title">${filename}</div>
    ${rendered}
  </div>`;
    };
  })
  .use(markdownItAttrs, {
    leftDelimiter: "{",
    rightDelimiter: "}",
    allowedAttributes: ["id", "class", /^data-.*$/],
  });

export default mdIt;
