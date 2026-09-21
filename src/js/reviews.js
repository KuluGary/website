export function getCollectionsWithReviews() {
  return [];
}

// import fg from "fast-glob";
// import fs from "fs";
// import matter from "gray-matter";
// import MarkdownIt from "markdown-it";

// export async function getCollectionsWithReviews(entities) {
//   const files = await fg("src/reviews/**/*.md");
//   const md = new MarkdownIt();

//   const reviews = new Map();

//   for (const file of files) {
//     const contents = fs.readFileSync(file);
//     const stats = fs.statSync(file);
//     const { data, content } = matter(contents);

//     reviews.set(data.entityId, {
//       ...data,
//       content,
//       date: stats.birthtime,
//       draft: stats.draft,
//       html: md.render(content),
//     });
//   }

//   return entities.map((entity) => ({
//     ...entity,
//     review: reviews.get(entity.id) ?? undefined,
//   }));
// }
