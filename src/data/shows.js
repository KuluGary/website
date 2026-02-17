// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";

// export default async function () {
// 	const cached = getFromCache("shows");

// 	if (cached) return cached;

// 	const showsQuery = supabase.from("shows").select();

// 	const { data, error } = await showsQuery;

// 	if (error) throw new Error(error);

// 	setIntoCache("shows", data);

// 	return data;
// }

export default async function () {
  return [];
}
