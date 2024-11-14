// src/app/api/posts/route.ts

import { groq } from "next-sanity";
import client from "@/lib/sanityClient";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const status = searchParams.get("status") || "published";
	const sortOrder = searchParams.get("sortOrder") || "desc";
	const tags = searchParams.get("tags");

	let query = groq`*[_type == "post" && status == $status`;

	if (tags) {
		const tagsArray = tags.split(",").map((tag) => tag.trim().toLowerCase());
		query += ` && tag[$status in $tagsArray]`;
	}

	query += `] | order(publishedAt ${sortOrder}) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    "mainImageUrl": mainImage.asset->url,
    status,
    tags,
    author->{
      username,
      firstName,
      lastName
    }
  }`;

	try {
		const posts = await client.fetch(query, {
			status,
			tagsArray: tags
				? tags.split(",").map((tag) => tag.trim().toLowerCase())
				: [],
		});
		return NextResponse.json({ posts }, { status: 200 });
	} catch (error) {
		console.error("Error fetching posts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch posts." },
			{ status: 500 }
		);
	}
}
