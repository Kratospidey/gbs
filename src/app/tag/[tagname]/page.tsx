// src/app/tag/[tagname]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Tag } from "@/components/Tag";
import { useDebounce } from "@/hooks/useDebounce";

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
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto p-6">
				<h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-white">
					Posts Tagged with "{tagname}"
				</h1>

				{/* Loading State */}
				{isLoading && (
					<p className="text-center text-gray-600 dark:text-gray-300">
						Loading posts...
					</p>
				)}

				{/* Error State */}
				{error && (
					<p className="text-center text-red-500 dark:text-red-400">{error}</p>
				)}

				{/* Posts List */}
				{!isLoading && !error && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{posts.map((post) => (
							<div
								key={post._id}
								className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-transform transform hover:scale-105"
							>
								{post.mainImageUrl && (
									<Image
										src={post.mainImageUrl}
										alt={post.title}
										width={800}
										height={600}
										className="w-full h-48 object-cover"
									/>
								)}
								<div className="p-4">
									<Link href={`/posts/${post.slug}`}>
										<h2 className="text-xl font-semibold text-gray-800 dark:text-white hover:text-blue-500">
											{post.title}
										</h2>
									</Link>
									<p className="text-sm text-gray-600 dark:text-gray-300">
										Published on{" "}
										{new Date(post.publishedAt).toLocaleDateString()}{" "}
										{post.author ? (
											<>
												by {post.author.firstName} {post.author.lastName} (@
												{post.author.username})
											</>
										) : (
											"by Unknown Author"
										)}
									</p>
									{post.tags && (
										<div className="mt-2 flex flex-wrap gap-2">
											{post.tags.map((tag) => (
												<Tag key={tag} text={tag} />
											))}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				{/* No Posts Found */}
				{!isLoading && !error && posts.length === 0 && (
					<p className="text-center text-gray-600 dark:text-gray-300 mt-10">
						No posts found for this tag.
					</p>
				)}
			</div>
		</div>
	);
};

export default TagPage;
