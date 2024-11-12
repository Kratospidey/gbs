// src/app/api/profile/[username]/route.ts

import { NextResponse } from "next/server";
import client from "@/lib/sanityClient"; // Sanity client
import { clerkClient } from "@clerk/nextjs/server"; // Clerk client
import { urlFor } from "@/lib/urlFor"; // URL builder for Sanity images
import groq from "groq"; // GROQ tagged template

export async function GET(
	request: Request,
	{ params }: { params: { username: string } }
) {
	try {
		const { username } = params;
		console.log("API: Fetching user", username);

		// **Fix: Use 'name' instead of 'username' if 'name' is the correct field for username in Sanity**
		const authorQuery = groq`*[_type == "author" && name == $username][0]{
      clerk_id,
      _id,
      name, // Username field
      firstName,
      lastName,
      bio,
      image,
      "github": coalesce(github, ""),    // Handle null/undefined
      "linkedin": coalesce(linkedin, ""), // Handle null/undefined
      "website": coalesce(website, ""),   // Handle null/undefined
      email
    }`;

		const author = await client.fetch(authorQuery, { username });

		if (!author || !author.clerk_id) {
			console.log("API: Author not found in Sanity or clerk_id missing.");
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		console.log("API: Found author in Sanity:", author);

		// Debug: Check bio and image
		console.log("API: Author bio:", author.bio);
		console.log("API: Author image:", author.image);

		// Step 2: Use clerk_id to fetch the Clerk user
		const clerkInstance =
			typeof clerkClient === "function" ? await clerkClient() : clerkClient;

		const clerkUser = await clerkInstance.users.getUser(author.clerk_id);

		if (!clerkUser) {
			console.log("API: Clerk user not found with clerk_id:", author.clerk_id);
			return NextResponse.json(
				{ error: "User not found in Clerk" },
				{ status: 404 }
			);
		}

		const email =
			clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0
				? clerkUser.emailAddresses[0].emailAddress
				: "";

		// Step 3: Fetch published posts by author using corrected GROQ query
		const postsQuery = groq`*[_type == "post" && author._ref == $authorId && status == "published"]{
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      "mainImageUrl": mainImage.asset->url,
      status,
      tags, // Ensure 'tags' field exists
      author->{
        name,
        clerk_id,
        firstName,
        lastName
      }
    }`;

		const posts = await client.fetch(postsQuery, { authorId: author._id });

		console.log("API: Fetched posts:", posts.length);

		// Step 4: Enrich posts with author information
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

		// Step 5: Prepare user data including email
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
			profilePicture: author.image
				? urlFor(author.image).url()
				: "/default-avatar.png",
			github: author.github || "",
			linkedin: author.linkedin || "",
			website: author.website || "",
			email: email,
		};

		console.log("API: User data prepared successfully:", user);

		return NextResponse.json(
			{ user: user, posts: enrichedPosts },
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("API: Error fetching profile data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch profile data." },
			{ status: 500 }
		);
	}
}
