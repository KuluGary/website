export default async function () {
  return [];
}

// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";
// import { saveTestData } from "../js/save.js";
// import { getCollectionsWithReviews } from "../js/reviews.js";

// export default async function ({ collections }) {
//   const cached = getFromCache("games");

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
// 				time_state(total_seconds),
// 				achievements:relationships!relationships_parent_entity_id_fkey(
// 					child_entity_id,
// 					achievement:entities!relationships_child_entity_id_fkey(
// 						id,
// 						title,
// 						kind,
// 						entity_metadata(data)
// 					)
// 				)
// 			`,
//     )
//     .eq("kind", "game");

//   if (error) throw error;

//   const games = data.map((game) => ({
//     id: game.id,
//     title: game.title,
//     kind: game.kind,
//     metadata: game.entity_metadata?.data ?? {},
//     timeSeconds: game.time_state?.total_seconds ?? 0,
//     achievements: (game.achievements || [])
//       .map((rel) => {
//         return {
//           id: rel.achievement.id,
//           title: rel.achievement.title,
//           kind: rel.achievement.kind,
//           metadata: rel.achievement.entity_metadata?.data ?? {},
//         };
//       })
//       .sort((a, b) => {
//         const aLast = a?.metadata?.dateUnlocked;
//         const bLast = b?.metadata?.dateUnlocked;

//         if (aLast == null && bLast == null) return 0;

//         if (aLast == null) return 1;
//         if (bLast == null) return -1;

//         const aLastTimestamp = new Date(aLast).getTime();
//         const bLastTimestamp = new Date(bLast).getTime();

//         return bLastTimestamp - aLastTimestamp;
//       }),
//   }));

//   const gamesWithReview = await getCollectionsWithReviews(games);

//   setIntoCache("games", gamesWithReview);
//   saveTestData("games.json", gamesWithReview);

//   return gamesWithReview;
// }
