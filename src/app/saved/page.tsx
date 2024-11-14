// src/app/saved/page.tsx
"use client";

import { useEffect, useState } from "react";
import client from "@/lib/sanityClient";
import { groq } from "next-sanity";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import SavedPostsList from "@/components/SavedPostsList";

interface Author {
	name: string;
	image: any;
}

interface Post {
	_id: string;
	title: string;
	slug: any;
	mainImage: any;
	description: string;
	author: Author;
	publishedAt: string;
}

interface SavedPost {
	post: Post;
	savedAt: string;
}

interface SavedPostsData {
	posts: SavedPost[];
}

const query = groq`
  *[_type == "savedPost" && user->clerk_id == $clerkId][0]{
    posts[]{
      post->{
        _id,
        title,
        slug,
        mainImage,
        description,
        author->{
          name,
          image
        },
        publishedAt
      },
      savedAt
    }
  }
`;

export default function SavedPostsPage() {
	const [savedPosts, setSavedPosts] = useState<SavedPostsData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { user, isLoaded } = useUser();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && !user) {
			router.push("/signin");
		}
	}, [isLoaded, user, router]);

	useEffect(() => {
		const fetchSavedPosts = async () => {
			if (!user) return;
			try {
				const posts = await client.fetch(query, { clerkId: user.id });
				setSavedPosts(posts);
			} catch (error) {
				console.error("Error fetching saved posts:", error);
			}
			setIsLoading(false);
		};

		fetchSavedPosts();
	}, [user]);

	if (!isLoaded || !user) {
		return (
			<div className="min-h-screen flex items-center justify-center ">
				<div className="text-lg text-gray-600 dark:text-gray-300">
					Loading...
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg text-white-600">Loading saved posts...</div>
			</div>
		);
	}

	if (!savedPosts || !savedPosts.posts?.length) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg text-white-600">No Saved Post Found</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl">
			<h1 className="text-3xl font-bold mb-0.01 text-center">
				Your Saved Posts
			</h1>
			<SavedPostsList posts={savedPosts.posts} />
		</div>
	);
}
