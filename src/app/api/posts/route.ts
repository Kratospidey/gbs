// src/app/api/posts/route.ts
import { NextResponse } from "next/server";
import sanityClient from "@/lib/sanityClient";
import { getClerkUserByUsername } from "@/lib/getClerkUserByUsername";

// Add Route Segment Config
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
	authorFirstName?: string;
	authorLastName?: string;
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
			finalQuery += ` && (${tags.map((tag) => `"${tag}" in tags`).join(" || ")})`;
		}

		finalQuery += `] | order(publishedAt ${sortOrder}) {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      tags,
      "mainImageUrl": mainImage.asset->url,
      "authorName": author->name,
      "authorFirstName": author->firstName,
      "authorLastName": author->lastName
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

		// Enrich posts with author information from Sanity
		const enrichedPosts = posts.map((post) => {
			if (!post.authorName) {
				console.warn(`Post "${post.title}" has no authorName.`);
				return post;
			}
			const clerkUser = usernameToClerkUser[post.authorName];
			if (clerkUser) {
				return {
					...post,
					author: {
						username: clerkUser.username,
						firstName: post.authorFirstName || "",
						lastName: post.authorLastName || "",
					},
				};
			}
			console.warn(`No Clerk user found for username ${post.authorName}`);
			return post;
		});

		console.log("Enriched Posts:", JSON.stringify(enrichedPosts, null, 2));

		return NextResponse.json({ posts: enrichedPosts }, { status: 200 });
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		console.error("Error fetching posts:", errorMessage);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
