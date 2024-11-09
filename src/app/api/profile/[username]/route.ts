// src/app/api/profile/[username]/route.ts
import { clerkClient } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";
import client from "@/lib/sanityClient";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    console.log("API: Fetching user", params.username); // Debug log

    const clerk = await clerkClient();
    const clerkResponse = await clerk.users.getUserList({
      username: [params.username],
    });

    const clerkUsers = clerkResponse.data;

    console.log("API: Clerk users found:", clerkUsers.length); // Debug log

    if (!clerkUsers.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get Supabase profile
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", clerkUsers[0].id)
      .single();

    console.log("API: Supabase profile:", profile); // Debug log

    if (error) {
      console.error("API: Supabase error:", error); // Debug log
      throw error;
    }

    // Get Sanity posts including the 'status' field
    const posts = await client.fetch(
      `
      *[_type == "post" && author->clerk_id == $clerkId]{
          _id,
          title,
          "slug": slug.current,
          "image_url": mainImage.asset->url,
          _createdAt,
          status
      }
      `,
      { clerkId: clerkUsers[0].id }
    );

    console.log("API: Clerk user data:", clerkUsers[0]); // Debug log

    return NextResponse.json({
      user: {
        ...profile,
        username: params.username,
        name: `${profile.first_name} ${profile.last_name}`,
        email: clerkUsers[0].emailAddresses[0].emailAddress, // Get email from Clerk
        avatar_url: profile.profile_picture, // Explicitly include profile picture
      },
      posts: posts.map((post: any) => ({
        id: post._id,
        title: post.title,
        created_at: post._createdAt,
        image_url: post.image_url,
        slug: post.slug,
        status: post.status, // Include status
      })),
    });
  } catch (error) {
    console.error("API: Error fetching profile:", error); // Debug log
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
