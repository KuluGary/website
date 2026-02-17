import { execSync } from "child_process";

export default function () {
	try {
		const output = execSync(
			`git log --pretty=format:"%H|%an|%ad|%s" --date=iso`,
			{ encoding: "utf8" }
		);


		return output.split("\n").map(line => {
			const [hash, author, date, message] = line.split("|");

			return {
				hash,
				author,
				date: new Date(date),
				message
			};
		});
	} catch (err) {
		console.error("Failed to load git commits", err);
		return [];
	}
}

