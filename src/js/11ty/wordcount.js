const { JSDOM } = require("jsdom");

const TO_STRIP = ["code", "pre code", "script", ".header-anchor"];

function extractText(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove non-text elements
  document.querySelectorAll(TO_STRIP.join(", ")).forEach((child) => child.remove());

  return document.body.textContent;
}

const cache = {};

function countWords(value) {
  if (cache[value]) {
    return cache[value];
  }

  const result = extractText(value)
    .split(/[\s;/\\]/)
    .map((x) => x.trim())
    // Word is non-empty with at least one letter or number
    .filter((x) => x.match(/.*[a-z0-9].*/i)).length;

  cache[value] = result;
  return result;
}

module.exports = (eleventyConfig) => {
  eleventyConfig.addFilter("wordStats", countWords);
};
