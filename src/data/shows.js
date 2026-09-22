export default async function () {
  return [];
}

// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";
// import { saveTestData } from "../js/save.js";

// export default async function () {
//   const cached = getFromCache("shows");

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
//     .eq("kind", "show");

//   if (error) throw error;

//   const shows = data.map((show) => ({
//     id: show.id,
//     title: show.title,
//     kind: show.kind,
//     metadata: show.entity_metadata?.data ?? {},
//   }));

//   const groupedShows = shows.reduce((acc, curr) => {
//     const status = curr.metadata.status;

//     if (acc[status]) {
//       acc[status].push(curr);
//     } else {
//       acc[status] = [curr];
//     }

//     return acc;
//   }, {});

//   setIntoCache("shows", groupedShows);
//   saveTestData("shows.json", groupedShows);

//   return groupedShows;
// }
