/**
 * Generates a social media share URL for a given site with the provided metadata.
 *
 * @param {string} pageUrl - The URL of the page to share.
 * @param {"twitter" | "tumblr" | "reddit"} site - The social media platform to generate the share URL for.
 * @param {string} title - The title or text to accompany the shared link.
 * @param {string[]} tags - An array of tags or hashtags to include in the share (used by Twitter and Tumblr).
 * @returns {URL} A URL object representing the share link for the specified platform.
 */
export default function getShareUrl(pageUrl, site, title, tags) {
  let url = "";

  switch (site) {
    case "twitter":
      const twitterUrl = new URL("https://twitter.com/intent/tweet/");
      twitterUrl.searchParams.append("url", pageUrl);
      twitterUrl.searchParams.append("text", title);
      twitterUrl.searchParams.append("hashtags", tags.join(","));

      url = twitterUrl;
      break;
    case "tumblr":
      const tumblrUrl = new URL("http://tumblr.com/widgets/share/tool");
      tumblrUrl.searchParams.append("posttype", "link");
      tumblrUrl.searchParams.append("canonicalUrl", pageUrl);
      tumblrUrl.searchParams.append("title", title);
      tumblrUrl.searchParams.append("tags", tags.join(","));

      url = tumblrUrl;
      break;
    case "reddit":
      const redditUrl = new URL("https://reddit.com/submit");
      redditUrl.searchParams.append("url", pageUrl);
      redditUrl.searchParams.append("title", title);

      url = redditUrl;
      break;
    case "bluesky":
      const bskyUrl = new URL("https://bsky.app/intent/compose");
      bskyUrl.searchParams.append("text", `${title} ${tags.map((tag) => `#${tag}`).join(" ")} ${pageUrl}`);

      url = bskyUrl;
      break;
  }

  return url;
}
