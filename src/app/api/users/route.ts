// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import client from "@/lib/sanityClient";
import groq from "groq";
import { getClerkUserByUsername } from "@/lib/getClerkUserByUsername";

// Add Route Segment Config
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ClerkUser {
	id: string;
	username: string | null;
	// Add other relevant fields if needed
}

interface User {
	_id: string;
	name: string;
	firstName: string;
	lastName: string;
	bio: string;
	imageUrl: string | null;
	github: string;
	linkedin: string;
	website: string;
	email: string;
}

interface EnrichedUser {
	user: User;
	clerkUser?: ClerkUser;
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const username = url.searchParams.get("username");

		// Build GROQ query
		let userQuery = `*[_type == "author"`;
		const params: Record<string, any> = {};

		if (username) {
			userQuery += ` && name == $username`;
			params.username = username;
		}

		userQuery += `]{
      _id,
      name,
      firstName,
      lastName,
      bio,
      "imageUrl": image.asset->url,
      github,
      linkedin,
      website,
      email,
      clerk_id
    }`;

		const users: User[] = await client.fetch(userQuery, params);

		if (username) {
			const user = users[0];
			if (!user) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			// Fetch Clerk user
			const clerkUser = await getClerkUserByUsername(user.name);
			const enrichedUser: EnrichedUser = {
				user,
				clerkUser: clerkUser
					? {
							id: clerkUser.id,
							username: clerkUser.username,
						}
					: undefined,
			};

			return NextResponse.json({ user: enrichedUser }, { status: 200 });
		} else {
			// If no username filter, return all users
			// Optionally implement pagination if needed

			// Extract unique author names
			const uniqueAuthorNames = Array.from(
				new Set(users.map((user) => user.name))
			).filter(Boolean);

			// Fetch Clerk users
			const clerkUsers = await Promise.all(
				uniqueAuthorNames.map((name) => getClerkUserByUsername(name))
			);

			// Create a mapping from username to Clerk user
			const usernameToClerkUser: Record<string, ClerkUser> = {};
			clerkUsers.forEach((user) => {
				if (user && user.username && user.id) {
					usernameToClerkUser[user.username] = {
						id: user.id,
						username: user.username,
					};
				}
			});

			// Enrich users with Clerk information
			const enrichedUsers: EnrichedUser[] = users.map((user) => ({
				user,
				clerkUser: usernameToClerkUser[user.name],
			}));

			return NextResponse.json({ users: enrichedUsers }, { status: 200 });
		}
	} catch (error: any) {
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		console.error("Error fetching users:", errorMessage);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
