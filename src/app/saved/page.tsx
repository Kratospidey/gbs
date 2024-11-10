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
	image: any; // Update this type based on your image structure
}

interface Category {
	title: string;
	description: string;
}

interface Post {
	_id: string;
	title: string;
	slug: any; // Update this type based on your slug structure
	mainImage: any; // Update this type based on your image structure
	description: string;
	author: Author;
	categories: Category[];
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
  *[_type == "savedPost" && user == $userId][0]{
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
        categories[]->{
          title,
          description
        },
        publishedAt
      },
      savedAt
    }
  }`;

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
				const posts = await client.fetch(query, { userId: user.id });
				setSavedPosts(posts);
			} catch (error) {
				console.error("Error fetching saved posts:", error);
			}
			setIsLoading(false);
		};

		fetchSavedPosts();
	}, [user]);

	// Show loading state during auth check
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
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-lg text-gray-600">Loading saved posts...</div>
			</div>
		);
	}

	if (!savedPosts || !savedPosts.posts?.length) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center p-6 bg-white rounded shadow-md">
					<h2 className="text-2xl font-semibold mb-4">No saved posts found</h2>
					<p className="text-gray-600">You haven&apos;t saved any posts yet.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Your Saved Posts</h1>
			<SavedPostsList posts={savedPosts.posts} />
		</div>
	);
}
