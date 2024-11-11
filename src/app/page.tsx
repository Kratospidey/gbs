// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThreeDPostCard from "@/components/ThreeDPostCard";
import { useDebounce } from "@/hooks/useDebounce";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
	const router = useRouter();
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

	const handleSortChange = (value: "asc" | "desc") => {
		setSortOrder(value);
	};

	const handleTagFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTagFilter(e.target.value);
	};

	const handleTagSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
	};

	return (
		<div className="min-h-screen px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto p-6">
				<h1 className="text-4xl font-bold mb-6 text-zinc-900 dark:text-zinc-50 text-center">
					All Published Posts
				</h1>

				{/* Sorting and Filtering Options */}
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 space-y-4 md:space-y-0 md:space-x-4">
					{/* Sort By Date */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
						<label
							htmlFor="sort"
							className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
						>
							Sort by Date
						</label>
						<Select value={sortOrder} onValueChange={handleSortChange}>
							<SelectTrigger className="w-full sm:w-48 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 backdrop-blur-xl text-zinc-900 dark:text-zinc-100">
								<SelectValue placeholder="Select order" />
							</SelectTrigger>
							<SelectContent className="bg-white/80 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
								<SelectItem
									value="desc"
									className="text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-zinc-100"
								>
									Newest First
								</SelectItem>
								<SelectItem
									value="asc"
									className="text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-zinc-100"
								>
									Oldest First
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Filter by Tags */}
					<form
						onSubmit={handleTagSubmit}
						className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 backdrop-blur-xl rounded-md p-2 bg-white/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800"
					>
						<label
							htmlFor="tags"
							className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
						>
							Filter by Tags
						</label>
						<div className="flex space-x-2">
							<Input
								type="text"
								id="tags"
								placeholder="e.g., react, nextjs"
								value={tagFilter}
								onChange={handleTagFilterChange}
								className="w-full sm:w-48 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 backdrop-blur-xl"
							/>
							<Button
								type="submit"
								variant="outline"
								className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 backdrop-blur-xl text-zinc-900 dark:text-zinc-100 focus:ring-zinc-200 dark:focus:ring-zinc-800"
							>
								Apply
							</Button>
						</div>
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
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
						{posts.map((post) => (
							<ThreeDPostCard key={post._id} post={post} />
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
