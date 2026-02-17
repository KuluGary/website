// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";

// export default async function () {
// 	const cached = getFromCache("movies");

// 	if (cached) return cached;

// 	const moviesQuery = supabase.from("movies").select();

// 	const { data, error } = await moviesQuery;

// 	if (error) throw new Error(error);

// 	setIntoCache("movies", data);

// 	return data;
// }

export default async function () {
  return [];
}
