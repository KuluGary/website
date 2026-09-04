import fs from "node:fs";

const links = JSON.parse(fs.readFileSync("./src/data/links.json", "utf8"));

export function generateCodeBlocks(md) {
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
}

export function generateLinks(md) {
  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, _, self) {
      return self.renderToken(tokens, idx, options);
    };

  const defaultLinkClose =
    md.renderer.rules.link_close ||
    function (tokens, idx, options, _, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const href = token.attrGet("href");

    if (href && /^https?:\/\//.test(href)) {
      const link = links[href];

      if (link?.result === "dead") {
        token.attrJoin("class", "dead-link");

        if (link.wayback) {
          token.attrSet("data-wayback", link.wayback);
        }
      }
    }

    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  md.renderer.rules.link_close = function (tokens, idx, options, env, self) {
    const rendered = defaultLinkClose(tokens, idx, options, env, self);

    // Find the corresponding link_open token.
    for (let i = idx - 1; i >= 0; i--) {
      const token = tokens[i];

      if (token.type === "link_open") {
        const wayback = token.attrGet("data-wayback");

        if (wayback) {
          return rendered + ` <a href="${md.utils.escapeHtml(wayback)}" class="wayback-link">[archived]</a>`;
        }

        break;
      }

      // Don't cross another link.
      if (token.type === "link_close") {
        break;
      }
    }

    return rendered;
  };
}
