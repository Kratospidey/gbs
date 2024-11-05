// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
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

const HomePage: React.FC = () => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [tagFilter, setTagFilter] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const debouncedTagFilter = useDebounce(tagFilter, 500);

	useEffect(() => {
		const fetchPosts = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams();
				params.append("status", "published");
				params.append("sortOrder", sortOrder);
				if (debouncedTagFilter.trim() !== "") {
					params.append("tags", debouncedTagFilter);
				}

				const response = await fetch(`/api/posts?${params.toString()}`);
				const data = await response.json();

				if (response.ok) {
					setPosts(data.posts);
				} else {
					setError(data.error || "Failed to fetch posts.");
					console.error("Error fetching posts:", data.error);
				}
			} catch (error) {
				setError("An unexpected error occurred.");
				console.error("Error fetching posts:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPosts();
	}, [sortOrder, debouncedTagFilter]);

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSortOrder(e.target.value as "asc" | "desc");
	};

	const handleTagFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTagFilter(e.target.value);
	};

	const handleTagSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
	};

	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto p-6">
				<h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-white">
					All Published Posts
				</h1>

				{/* Sorting and Filtering Options */}
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 space-y-4 md:space-y-0">
					{/* Sort By Date */}
					<div>
						<label
							htmlFor="sort"
							className="mr-2 text-gray-700 dark:text-gray-300"
						>
							Sort by Date:
						</label>
						<select
							id="sort"
							value={sortOrder}
							onChange={handleSortChange}
							className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
						>
							<option value="desc">Newest First</option>
							<option value="asc">Oldest First</option>
						</select>
					</div>

					{/* Filter by Tags */}
					<form onSubmit={handleTagSubmit} className="flex items-center">
						<label
							htmlFor="tags"
							className="mr-2 text-gray-700 dark:text-gray-300"
						>
							Filter by Tags:
						</label>
						<input
							type="text"
							id="tags"
							placeholder="e.g., react, nextjs"
							value={tagFilter}
							onChange={handleTagFilterChange}
							className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
						/>
						<button
							type="submit"
							className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
						>
							Apply
						</button>
					</form>
				</div>

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
							<Link
								href={`/posts/${post.slug}`}
								key={post._id}
								className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-transform transform hover:scale-105 cursor-pointer"
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
									<h2 className="text-xl font-semibold text-gray-800 dark:text-white hover:text-blue-500">
										{post.title}
									</h2>
									<p className="text-sm text-gray-600 dark:text-gray-300">
										Published on{" "}
										{new Date(post.publishedAt).toLocaleDateString()}{" "}
										{post.author ? (
											<>
												by{" "}
												<Link
													href={`/profile/${post.author.username}`}
													onClick={(e) => e.stopPropagation()}
													className="text-blue-500 cursor-pointer"
												>
													@{post.author.username}
												</Link>
											</>
										) : (
											"by Unknown Author"
										)}
									</p>
									{post.tags && (
										<div className="mt-2 flex flex-wrap gap-2">
											{post.tags.map((tag) => (
												<div 
													key={tag} 
													onClick={(e) => {
														e.preventDefault(); // Prevent post link navigation
														e.stopPropagation(); // Stop event bubbling
													}}
												>
													<Tag 
														text={tag} 
														isEditable={false} 
													/>
												</div>
											))}
										</div>
									)}
								</div>
							</Link>
						))}
					</div>
				)}

				{/* No Posts Found */}
				{!isLoading && !error && posts.length === 0 && (
					<p className="text-center text-gray-600 dark:text-gray-300 mt-10">
						No posts found.
					</p>
				)}
			</div>
		</div>
	);
};

export default HomePage;
