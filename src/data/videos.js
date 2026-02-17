// // @ts-check
// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";

// /** @typedef {import("../types/database.types.js").Tables<"videos">} Video */

// /**
//  * Fetch videos from cache or Supabase.
//  * @returns {Promise<Video[]>}
//  */
// export default async function getVideos() {
// 	/** @type {Video[] | null} */
// 	const cached = getFromCache("videos");

// 	if (cached) return cached;

// 	const { data, error } = await supabase.from("videos").select();

// 	if (error) throw new Error(error.message);

// 	/** @type {Video[]} */
// 	const videos = data ?? [];

// 	setIntoCache("videos", videos);

// 	return videos;
// }

export default async function () {
  return [];
}
