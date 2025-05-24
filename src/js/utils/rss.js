const Parser = require("rss-parser");

function parseRSS(RSSUrl) {
  const parser = new Parser();

  return parser.parseURL(RSSUrl);
}

module.exports = { parseRSS };
