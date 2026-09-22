export default async function () {
  return [];
}

// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";
// import { saveTestData } from "../js/save.js";

// export default async function () {
//   const cached = getFromCache("blogroll");

//   if (cached) return cached;

//   return [];

//   const { data, error } = await supabase
//     .from("entities")
//     .select(
//       `
// 				id,
// 				title,
// 				kind,
// 				entity_metadata(data),
//         blog_posts:relationships!relationships_parent_entity_id_fkey(
//           child_entity_id,
//           blog_post:entities!relationships_child_entity_id_fkey(
//             id,
//             title,
//             kind,
//             entity_metadata(data)
//           )
//         )
// 			`,
//     )
//     .eq("kind", "blog");

//   if (error) throw error;

//   const blogroll = data.map((feed) => ({
//     id: feed.id,
//     title: feed.title,
//     kind: feed.kind,
//     metadata: feed.entity_metadata?.data ?? {},
//     blog_posts: (feed.blog_posts || []).map((rel) => {
//       return {
//         id: rel.blog_post.id,
//         title: rel.blog_post.title,
//         kind: rel.blog_post.kind,
//         metadata: rel.blog_post.entity_metadata?.data ?? {},
//       };
//     }),
//   }));

//   setIntoCache("blogroll", blogroll);
//   saveTestData("blogroll.json", blogroll);

//   return blogroll;
// }
