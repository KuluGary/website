export default async function () {
  return [];
}

// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";
// import { saveTestData } from "../js/save.js";

// export default async function () {
//   const cached = getFromCache("manga");

//   if (cached) return cached;

//   return [];

//   const { data, error } = await supabase
//     .from("entities")
//     .select(
//       `
//         id,
//         title,
//         kind,
//         entity_metadata(data)
//       `,
//     )
//     .eq("kind", "manga");

//   if (error) throw error;

//   const manga = data.map((manga) => ({
//     id: manga.id,
//     title: manga.title,
//     kind: manga.kind,
//     metadata: manga.entity_metadata?.data ?? {},
//   }));

//   setIntoCache("manga", manga);
//   saveTestData("manga.json", manga);

//   return manga;
// }
