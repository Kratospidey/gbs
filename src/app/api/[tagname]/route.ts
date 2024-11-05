// src/app/api/[tagname]/route.ts
import { NextResponse } from "next/server";
import sanityClient from "@/lib/sanityClient";

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
	mainImageUrl?: string;
	status: "pending" | "published" | "draft" | "archived";
	tags?: string[];
	author?: Author;
}

export async function GET(
	request: Request,
	{ params }: { params: { tagname: string } }
) {
	try {
		const { tagname } = params;

		// Construct the GROQ query to fetch posts with the specified tag
		const finalQuery = `*[_type == "post" && status == "published" && "${tagname}" in tags] | order(publishedAt desc) {
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
			throw new Error("No posts found for the specified tag.");
		}

		// Enrich posts with author information if needed
		// (Reuse logic from existing API if applicable)

		return NextResponse.json({ posts }, { status: 200 });
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred.";
		console.error("Error fetching posts by tag:", errorMessage);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
