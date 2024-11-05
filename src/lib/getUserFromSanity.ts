// src/lib/getUserFromSanity.ts
import client from "@/lib/sanityClient";

export async function getUserFromSanity(username: string) {
	const query = `*[_type == "author" && username == $username][0]`;
	const params = { username };

	try {
		const user = await client.fetch(query, params);
		return user;
	} catch (error) {
		console.error("Error fetching user from Sanity:", error);
		return null;
	}
}
