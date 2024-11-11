// src/app/tag/[tagname]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ThreeDPostCard from "@/components/ThreeDPostCard";

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

const TagPage: React.FC = () => {
	const { tagname } = useParams();
	const [posts, setPosts] = useState<Post[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPostsByTag = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(`/api/${tagname}`);
				const data = await response.json();

				if (response.ok) {
					setPosts(data.posts);
				} else {
					setError(data.error || "Failed to fetch posts.");
					console.error("Error fetching posts by tag:", data.error);
				}
			} catch (error) {
				setError("An unexpected error occurred.");
				console.error("Error fetching posts by tag:", error);
			} finally {
				setIsLoading(false);
			}
		};

		if (tagname) {
			fetchPostsByTag();
		}
	}, [tagname]);

	return (
		<div className="min-h-screen">
			<div className="max-w-7xl mx-auto p-6">
				<h1 className="text-4xl font-bold mb-0.5 text-zinc-800 dark:text-zinc-100 text-center">
					Posts Tagged with &quot;{tagname}&quot;
				</h1>

				{/* Loading State */}
				{isLoading && (
					<p className="text-center text-zinc-600 dark:text-zinc-300 mt-20">
						Loading posts...
					</p>
				)}

				{/* Error State */}
				{error && (
					<p className="text-center text-red-500 dark:text-red-400">{error}</p>
				)}

				{/* Posts List */}
				{!isLoading && !error && (
					<div className="flex flex-wrap -mx-1 gap-3 justify-center">
						{posts.map((post) => (
							<div key={post._id}>
								<ThreeDPostCard post={post} />
							</div>
						))}
					</div>
				)}

				{/* No Posts Found */}
				{!isLoading && !error && posts.length === 0 && (
					<p className="text-center text-zinc-600 dark:text-zinc-300 mt-10">
						No posts found for this tag.
					</p>
				)}
			</div>
		</div>
	);
};

export default TagPage;
