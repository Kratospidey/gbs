// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeDPostCard } from "@/components/ThreeDPostCard";
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
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 space-y-4 md:space-y-0">
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
                            className="px-3 py-2 bg-[#0a101f] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="px-3 py-2 bg-[#0a101f] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="ml-2 px-4 py-2 bg-[#0a101f] text-white rounded-md hover:bg-[#09162b]"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
