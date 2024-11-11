// src/app/api/profile/[username]/route.ts
import { NextResponse } from "next/server";
import client from "@/lib/sanityClient"; // Sanity client
import { supabase } from "@/lib/supabaseClient"; // Supabase client
import { clerkClient } from "@clerk/nextjs/server"; // Clerk client

export async function GET(
	request: Request,
	{ params }: { params: { username: string } }
) {
	try {
		console.log("API: Fetching user", params.username);

		// Fetch Clerk users by username
		const clerk = await clerkClient();
		const clerkResponse = await clerk.users.getUserList({
			username: [params.username],
		});

		const clerkUsers = clerkResponse.data;

		console.log("API: Clerk users found:", clerkUsers.length);

		if (!clerkUsers.length) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Get Supabase profile
		const { data: profile, error } = await supabase
			.from("user_profiles")
			.select("*")
			.eq("user_id", clerkUsers[0].id)
			.single();

		console.log("API: Supabase profile:", profile);

		if (error) {
			console.error("API: Supabase error:", error);
			throw error;
		}

		// Updated Sanity query to correctly fetch posts
		const posts = await client.fetch(
			`*[_type == "post" && author->name == $username && status == "published"] {
        _id,
        title,
        "slug": slug.current,
        publishedAt,
        "mainImageUrl": mainImage.asset->url,
        status,
        "tags": tags,
        author-> {
          "username": name, // Explicitly rename to username here
          clerk_id
        }
      }`,
			{ username: params.username }
		);

		console.log("API: Fetched Posts:", JSON.stringify(posts, null, 2));

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
				username: post.author?.username || params.username, // Explicitly check for `username`
				clerk_id: post.author?.clerk_id,
			},
		}));

		return NextResponse.json(
			{ user: profile, posts: enrichedPosts },
			{ status: 200 }
		);
	} catch (error) {
		console.error("API: Error fetching profile data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch profile data." },
			{ status: 500 }
		);
	}
}
