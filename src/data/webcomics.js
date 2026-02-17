// import supabase from "../js/supabase.js";
// import { getFromCache, setIntoCache } from "../js/cache.js";

// export default async function () {
// 	const cached = getFromCache("webcomics");

// 	if (cached) return cached;

// 	const webcomicsQuery = supabase.from("webcomics").select();

// 	const { data, error } = await webcomicsQuery;

// 	if (error) throw new Error(error);

// 	setIntoCache("webcomics", data);

// 	return data;
// }

export default async function () {
  return [];
}
