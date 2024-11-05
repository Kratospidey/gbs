// src/lib/session.ts
import { currentUser } from "@clerk/nextjs/server";

interface User {
	id: string;
	email?: string;
	username?: string;
	// Add other user properties as needed
}

/**
 * Fetches the current logged-in user's information.
 * Returns `null` if no user is authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
	const user = await currentUser();

	if (!user) {
		return null;
	}

	return {
		id: user.id,
		email: user.emailAddresses[0]?.emailAddress,
		username: user.username ?? undefined,
		// Include other properties you need from the user object
	};
}
