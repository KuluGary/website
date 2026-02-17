// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";

// export default async function () {
// 	const cached = getFromCache("manga");

// 	if (cached) return cached;

// 	const mangaQuery = supabase.from("manga").select();

// 	const { data, error } = await mangaQuery;

// 	if (error) throw new Error(error);

// 	setIntoCache("manga", data);

// 	return data;
// }

export default async function () {
  return [];
}
