// src/app/api/posts/route.ts
import { NextResponse } from "next/server";
import sanityClient from "@/lib/sanityClient";
import { supabase } from "@/lib/supabaseClient";
import { getClerkUserByUsername } from "@/lib/getClerkUserByUsername";

interface Author {
	username: string;
	firstName: string;
	lastName: string;
}

interface Post {
	_id: string;
	title: string;
	slug: string;
	publishedAt: string;
	mainImageUrl: string;
	tags: string[];
	authorName: string | null;
	author?: Author;
}

interface ClerkUser {
	id: string;
	username: string;
	// Add other relevant fields if needed
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const status = url.searchParams.get("status") || "published";
		const tagsParam = url.searchParams.get("tags");
		const sortOrder = url.searchParams.get("sortOrder") || "desc";

		// Start building the query
		let finalQuery = `*[_type == "post" && status == "${status}"`;

		if (tagsParam) {
			const tags = tagsParam.split(",").map((tag) => tag.trim().toLowerCase());
			// Use the 'in' operator and ensure the condition is inside the []
			finalQuery += ` && (${tags.map((tag) => `"${tag}" in tags`).join(" || ")})`;
		}

		// Close the filter bracket after all conditions
		finalQuery += `] | order(publishedAt ${sortOrder}) {
        _id,
        title,
        "slug": slug.current,
        publishedAt,
        tags,
        "mainImageUrl": mainImage.asset->url,
        "authorName": author->name
    }`;

		console.log("Final GROQ Query:", finalQuery);

		const posts: Post[] = await sanityClient.fetch(finalQuery);

		if (!posts) {
			throw new Error("No posts fetched from Sanity.");
		}

		console.log("Fetched Posts:", JSON.stringify(posts, null, 2));

		// Extract unique author names, excluding nulls
		const uniqueAuthorNames = Array.from(
			new Set(posts.map((post) => post.authorName))
		).filter((name): name is string => !!name);

		console.log("Unique Author Names:", uniqueAuthorNames);

		// Fetch Clerk users
		const clerkUsers = await Promise.all(
			uniqueAuthorNames.map((name) => getClerkUserByUsername(name))
		);

		console.log("Fetched Clerk Users:", clerkUsers);

		// Create a mapping from username to Clerk user
		const usernameToClerkUser: Record<string, ClerkUser> = {};
		clerkUsers.forEach((user) => {
			if (user && user.username && user.id) {
				usernameToClerkUser[user.username] = user as ClerkUser;
			}
		});

		console.log("Username to ClerkUser Map:", usernameToClerkUser);

		// Fetch Supabase profiles
		const supabaseProfiles = await Promise.all(
			clerkUsers.map((user) => {
				if (user && user.id) {
					return supabase
						.from("user_profiles")
						.select("user_id, first_name, last_name")
						.eq("user_id", user.id)
						.single();
				}
				return null;
			})
		);

		console.log("Fetched Supabase Profiles:", supabaseProfiles);

		// Create a mapping from Clerk user ID to Supabase profile
		const userIdToProfile: Record<
			string,
			{ first_name: string; last_name: string }
		> = {};

		supabaseProfiles.forEach((profile) => {
			if (profile && profile.data && profile.data.user_id) {
				userIdToProfile[profile.data.user_id] = {
					first_name: profile.data.first_name,
					last_name: profile.data.last_name,
				};
			}
		});

		console.log("UserID to Profile Map:", userIdToProfile);

		// Enrich posts with author information
		const enrichedPosts = posts.map((post) => {
			if (!post.authorName) {
				console.warn(`Post "${post.title}" has no authorName.`);
				return post;
			}
			const clerkUser = usernameToClerkUser[post.authorName];
			if (clerkUser) {
				const profile = userIdToProfile[clerkUser.id];
				if (profile) {
					return {
						...post,
						author: {
							username: clerkUser.username,
							firstName: profile.first_name,
							lastName: profile.last_name,
						},
					};
				} else {
					console.warn(`No profile found for Clerk user ID ${clerkUser.id}`);
					return post;
				}
			}
			console.warn(`No Clerk user found for username ${post.authorName}`);
			return post;
		});

		console.log("Enriched Posts:", JSON.stringify(enrichedPosts, null, 2));

		return NextResponse.json({ posts: enrichedPosts }, { status: 200 });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		console.error("Error fetching posts:", errorMessage);
		return NextResponse.json(
			{ error: errorMessage },
			{ status: 500 }
		);
	}
}
