import { NextResponse } from "next/server";
import client from "@/lib/sanityClient"; // Sanity client
import groq from "groq"; // GROQ tagged template

export async function GET(
	request: Request,
	{ params }: { params: { username: string } }
) {
	try {
		const { username } = params;
		console.log("API: Fetching user", username);

		const authorQuery = groq`*[_type == "author" && name == $username][0]{
      clerk_id,
      _id,
      _updatedAt,
      name, // Username field
      firstName,
      lastName,
      bio,
      "imageUrl": image.asset->url,
      "github": coalesce(github, ""),
      "linkedin": coalesce(linkedin, ""),
      "website": coalesce(website, ""),
      email
    }`;

		const author = await client.fetch(authorQuery, { username });

		if (!author || !author.clerk_id) {
			console.log("API: Author not found in Sanity or clerk_id missing.");
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		console.log("API: Found author in Sanity:", author);

		const email = author.email || "";

		// Fetch published posts by author
		const postsQuery = groq`*[
      _type == "post" &&
      author._ref == $authorId &&
      lower(status) == "published"
    ]{
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      "mainImageUrl": mainImage.asset->url,
      status,
      tags,
      author->{
        name,
        clerk_id,
        firstName,
        lastName
      }
    }`;

		const posts = await client.fetch(postsQuery, { authorId: author._id });

		console.log("API: Fetched posts:", posts.length);

		// Enrich posts with author information
		const enrichedPosts = posts.map((post: any) => ({
			_id: post._id,
			title: post.title,
			slug: post.slug,
			publishedAt: post.publishedAt,
			mainImageUrl: post.mainImageUrl || "/default-thumbnail.jpg",
			status: post.status,
			tags: post.tags || [],
			author: {
				name: post.author?.name || username,
				clerk_id: post.author?.clerk_id || "",
				firstName: post.author?.firstName || "",
				lastName: post.author?.lastName || "",
			},
		}));

		// Prepare user data including email
		const user = {
			name: author.name,
			firstName: author.firstName,
			lastName: author.lastName,
			bio: Array.isArray(author.bio)
				? author.bio
						.map((block: any) =>
							block.children.map((child: any) => child.text).join("")
						)
						.join("\n")
				: "",
			profilePicture: author.imageUrl
				? `${author.imageUrl}?ver=${author._updatedAt}`
				: "/default-avatar.png",
			github: author.github || "",
			linkedin: author.linkedin || "",
			website: author.website || "",
			email: email,
		};

		console.log("API: User data prepared successfully:", user);

		return NextResponse.json(
			{ user: user, posts: enrichedPosts },
			{
				status: 200,
				headers: {
					"Cache-Control": "no-store", // Prevent caching of the response
				},
			}
		);
	} catch (error: any) {
		console.error("API: Error fetching profile data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch profile data." },
			{ status: 500 }
		);
	}
}
