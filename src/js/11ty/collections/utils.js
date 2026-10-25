export function getPostLang(post) {
  if (post.data.lang) return post.data.lang;

  const inputPath = (post.inputPath || "").replace(/\\/g, "/");
  const fileName = inputPath.split("/").at(-1) || "";
  const fileSlug = fileName.replace(/\.[^.]+$/, "");

  return fileSlug === "index" ? DEFAULT_LANG : fileSlug;
}

export const DEFAULT_LANG = "en";
