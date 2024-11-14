// src/app/api/profile/[username]/route.ts
import { NextResponse } from "next/server";
import client from "@/lib/sanityClient";
import groq from "groq";
import { getClerkUserByUsername } from "@/lib/getClerkUserByUsername";

export async function GET(
	request: Request,
	{ params }: { params: { username: string } }
) {
	try {
		const { username } = params;

		const authorQuery = groq`*[_type == "author" && name == $username][0]{
            clerk_id,
            _id,
            _updatedAt,
            name,
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
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const postsQuery = groq`*[
            _type == "post" &&
            references($authorId) &&
            lower(status) == "published"
        ]{
            _id,
            title,
            "slug": slug.current,
            publishedAt,
            "mainImageUrl": coalesce(mainImage.asset->url, null),
            status,
            tags,
            author->{
                name,
                clerk_id,
                firstName,
                lastName
            }
        } | order(publishedAt desc)`;

		const posts = await client.fetch(postsQuery, { authorId: author._id });

		const uniqueAuthorNames = Array.from(
			new Set(posts.map((post: any) => post.author.name))
		).filter((name): name is string => !!name);

		const clerkUsers = await Promise.all(
			uniqueAuthorNames.map((name) => getClerkUserByUsername(name))
		);

		const usernameToClerkUser: Record<string, any> = {};
		clerkUsers.forEach((user) => {
			if (user?.username && user.id) {
				usernameToClerkUser[user.username] = user;
			}
		});

		const enrichedPosts = posts.map((post: any) => {
			const clerkUser = usernameToClerkUser[post.author.name];
			return {
				...post,
				author: clerkUser
					? {
							username: clerkUser.username,
							firstName: post.author.firstName || "",
							lastName: post.author.lastName || "",
						}
					: post.author,
			};
		});

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
			github: author.github,
			linkedin: author.linkedin,
			website: author.website,
			email: author.email || "",
		};

		return NextResponse.json(
			{ user, posts: enrichedPosts },
			{
				status: 200,
				headers: {
					"Cache-Control": "no-store",
				},
			}
		);
	} catch (error: any) {
		return NextResponse.json(
			{ error: "Failed to fetch profile data." },
			{ status: 500 }
		);
	}
}
