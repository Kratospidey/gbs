// src/app/api/[tagname]/route.ts
import { NextResponse } from "next/server";
import sanityClient from "@/lib/sanityClient";

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

		// GROQ query to fetch posts by tag with enriched author information
		const finalQuery = `*[_type == "post" && "${tagname}" in tags && status == "published"] | order(publishedAt desc) {
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

		const posts: Post[] = await sanityClient.fetch(finalQuery);

		if (!posts) {
			throw new Error("No posts fetched from Sanity.");
		}

		// Enrich posts with author information from Sanity
		const enrichedPosts = posts.map((post) => ({
			...post,
			author: {
				username: post.authorName,
				firstName: post.authorFirstName || "",
				lastName: post.authorLastName || "",
			},
		}));

		return NextResponse.json({ posts: enrichedPosts }, { status: 200 });
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		console.error("Error fetching posts by tag:", errorMessage);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
