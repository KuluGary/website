import supabase from "../js/supabase.js";
import { getFromCache, setIntoCache } from "../js/cache.js";
import { saveTestData } from "../js/save.js";

export default async function () {
  const cached = getFromCache("books");

  if (cached) return cached;

  return [];

  const { data, error } = await supabase
    .from("entities")
    .select(
      `
				id,
				title,
				kind,
				entity_metadata(data)
			`,
    )
    .eq("kind", "book");

  if (error) throw error;

  const books = data.map((book) => ({
    id: book.id,
    title: book.title,
    kind: book.kind,
    metadata: book.entity_metadata?.data ?? {},
  }));

  setIntoCache("books", books);
  saveTestData("books.json", books);

  return books;
}
