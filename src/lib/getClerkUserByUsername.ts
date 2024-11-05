// src/lib/getClerkUserByUsername.ts
import { clerkClient } from "@clerk/clerk-sdk-node";
import type { User } from "@clerk/clerk-sdk-node";

export async function getClerkUserByUsername(username: string) {
	try {
		const clerkResponse = await clerkClient.users.getUserList({
			username: [username], // Use Clerk's built-in filtering
			limit: 1,
		});

		// Return first user from filtered results
		return clerkResponse.data[0] || null;
	} catch (error) {
		console.error("Error fetching user from Clerk:", error);
		return null;
	}
}
