// src/app/api/[tagname]/route.ts
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
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const tagname = url.pathname.split("/").pop(); // Extract tagname from the URL

		if (!tagname) {
			return NextResponse.json(
				{ error: "Tag name is required" },
				{ status: 400 }
			);
		}

		// GROQ query to fetch posts by tag
		const finalQuery = `*[_type == "post" && "${tagname}" in tags && status == "published"] | order(publishedAt desc) {
            _id,
            title,
            "slug": slug.current,
            publishedAt,
            tags,
            "mainImageUrl": mainImage.asset->url,
            "authorName": author->name
        }`;

		const posts: Post[] = await sanityClient.fetch(finalQuery);

		if (!posts) {
			throw new Error("No posts fetched from Sanity.");
		}

		// Extract unique author names
		const uniqueAuthorNames = Array.from(
			new Set(posts.map((post) => post.authorName))
		).filter(Boolean) as string[];

		// Fetch Clerk users based on author names
		const clerkUsers = await Promise.all(
			uniqueAuthorNames.map((name) => getClerkUserByUsername(name))
		);

		// Map usernames to Clerk users
		const usernameToClerkUser: Record<string, ClerkUser> = {};
		clerkUsers.forEach((user) => {
			if (user && user.username && user.id) {
				usernameToClerkUser[user.username] = {
					id: user.id,
					username: user.username
				};
			}
		});

		// Fetch user profiles from Supabase
		const userIds = clerkUsers.map((user) => user?.id).filter(Boolean);
		const { data: profiles, error: profilesError } = await supabase
			.from("user_profiles")
			.select("user_id, first_name, last_name")
			.in("user_id", userIds);

		if (profilesError) {
			console.error("Error fetching user profiles:", profilesError);
			throw new Error("Failed to fetch user profiles.");
		}

		// Map user IDs to profiles
		const userIdToProfile: Record<
			string,
			{ firstName: string; lastName: string }
		> = {};
		profiles.forEach((profile) => {
			userIdToProfile[profile.user_id] = {
				firstName: profile.first_name,
				lastName: profile.last_name,
			};
		});

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
							firstName: profile.firstName,
							lastName: profile.lastName,
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

		return NextResponse.json({ posts: enrichedPosts }, { status: 200 });
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		console.error("Error fetching posts by tag:", errorMessage);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
