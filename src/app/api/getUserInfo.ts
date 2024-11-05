// src/pages/api/getUserInfo.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getUserFromSanity } from "@/lib/getUserFromSanity";
import { getClerkUserByUsername } from "@/lib/getClerkUserByUsername";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { username } = req.query;

	if (!username || typeof username !== "string") {
		return res.status(400).json({ error: "Invalid username" });
	}

	// Fetch user data from Sanity
	const sanityUser = await getUserFromSanity(username);
	if (!sanityUser) {
		return res.status(404).json({ error: "User not found in Sanity" });
	}

	// Fetch corresponding Clerk user data
	const clerkUser = await getClerkUserByUsername(sanityUser.username);
	if (!clerkUser) {
		return res.status(404).json({ error: "User not found in Clerk" });
	}

	// Combine and return the data as needed
	const userData = {
		sanityData: sanityUser,
		clerkData: {
			id: clerkUser.id,
			email: clerkUser.emailAddresses[0]?.emailAddress,
			// Add other fields as necessary
		},
	};

	res.status(200).json(userData);
}
