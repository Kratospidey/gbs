// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import DarkModeToggle from "@/components/DarkModeToggle";
import { Button } from "@/components/ui/button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Tag } from "@/components/Tag";
import Image from "next/image";
import DashboardPostCard from "@/components/DashboardPostCard"; // Import the component

// Define nested interfaces
interface Slug {
	current: string;
}

interface Asset {
	url: string;
	_ref: string;
}

interface MainImage {
	asset: Asset;
}

interface Post {
	_id: string;
	title: string;
	slug: Slug;
	publishedAt: string;
	mainImage?: MainImage;
	status: "pending" | "published" | "draft" | "archived";
	tags?: string[];
}

const isArchived = (status: string): boolean => status === "archived";

const DashboardPage: React.FC = () => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [filter, setFilter] = useState<
		"published" | "drafts" | "archived" | "pending"
	>("published");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const router = useRouter();
	const { user, isLoaded } = useUser();

	// Define filter options with correct mapping
	const filterOptions: {
		label: string;
		value: "published" | "pending" | "drafts" | "archived";
	}[] = [
		{ label: "Published", value: "published" },
		{ label: "Pending", value: "pending" },
		{ label: "Drafts", value: "drafts" },
		{ label: "Archived", value: "archived" },
	];

	// Mapping of filter to no posts message
	const noPostsMessages: { [key in typeof filter]: string } = {
		published: "No published posts found.",
		pending: "No posts are pending review.",
		drafts: "No drafts found.",
		archived: "No archived posts found.",
	};

	// Add auth check effect
	useEffect(() => {
		if (isLoaded && !user) {
			router.push("/signin");
		}
	}, [isLoaded, user, router]);

	useEffect(() => {
		if (!user) return;

		const fetchPosts = async () => {
			try {
				let query = `*[_type == 'post' && author._ref == $userId`;

				switch (filter) {
					case "drafts":
						query += ` && status == 'draft'`;
						break;
					case "archived":
						query += ` && status == 'archived'`;
						break;
					case "pending":
						query += ` && status == 'pending'`;
						break;
					default: // published
						query += ` && status == 'published'`;
				}

				query += `] | order(publishedAt desc) {
          _id,
          title,
          slug,
          publishedAt,
          status,
          mainImage { asset->{ url, _ref } },
          tags
        }`;

				const data: Post[] = await client.fetch(query, { userId: user.id });
				console.log("Fetched posts: ", data);
				setPosts(data);
			} catch (error) {
				console.error("Error fetching posts: ", error);
				toast.error("Failed to fetch posts.");
			}
			setIsLoading(false);
		};

		fetchPosts();
	}, [user, filter]);

	// Show loading state during auth check
	if (!isLoaded || !user) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg text-gray-600 dark:text-gray-300">
					Loading...
				</div>
			</div>
		);
	}

	const handleDelete = async (postId: string, imageUrl: string | undefined) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this post?"
		);
		if (!confirmDelete) return;

		setIsLoading(true);
		try {
			await client.delete(postId);
			if (imageUrl) {
				const fileName = imageUrl.split("/").pop();
				const { error } = await supabase.storage
					.from("post_banners")
					.remove([`public/${fileName}`]);
				if (error) {
					console.error("Error deleting image from Supabase: ", error);
					toast.error("Failed to delete image from storage.");
				}
			}
			setPosts(posts.filter((post) => post._id !== postId));
			toast.success("Post deleted successfully!");
		} catch (error) {
			console.error("Error deleting post: ", error);
			toast.error("Failed to delete post.");
		}
		setIsLoading(false);
	};

	const handleEdit = (slug: { current?: string } | null) => {
		if (!slug || !slug.current) {
			console.error("Invalid slug provided");
			toast.error("Invalid slug provided.");
			return;
		}
		router.push(`/posts/edit/${slug.current}`);
	};

	const handleArchive = async (postId: string) => {
		const confirmArchive = window.confirm(
			"Are you sure you want to archive this post?"
		);
		if (!confirmArchive) return;

		setIsLoading(true);
		try {
			await client.patch(postId).set({ status: "archived" }).commit();
			setPosts(posts.filter((post) => post._id !== postId));
			toast.success("Post archived successfully!");
		} catch (error) {
			console.error("Error archiving post: ", error);
			toast.error("Failed to archive post.");
		}
		setIsLoading(false);
	};

	const handleUnarchive = async (postId: string) => {
		const confirmUnarchive = window.confirm(
			"Are you sure you want to unarchive this post?"
		);
		if (!confirmUnarchive) return;

		setIsLoading(true);
		try {
			await client.patch(postId).set({ status: "published" }).commit();
			// Re-fetch the updated post
			const updatedPost: Post = await client.fetch(
				`*[_type == 'post' && _id == $postId][0]`,
				{ postId }
			);
			setPosts([updatedPost, ...posts]);
			toast.success("Post unarchived successfully!");
		} catch (error) {
			console.error("Error unarchiving post: ", error);
			toast.error("Failed to unarchive post.");
		}
		setIsLoading(false);
	};

	return (
		<div className="max-w-5xl mx-auto p-6 dark:text-white">
			<ToastContainer />
			<h1 className="text-4xl font-bold mb-6 text-center text-foreground">
				My Posts
			</h1>

			{/* Filter Buttons */}
			<div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-1 px-2">
				{" "}
				{/* reduced mb-8 to mb-4 */}
				{filterOptions.map(({ label, value }) => (
					<Button
						key={label}
						onClick={() => setFilter(value)}
						variant={filter === value ? "default" : "outline"}
						className={`
							px-2 sm:px-4 py-2 
							rounded-md 
							transition-colors 
							text-xs 
							font-medium
							whitespace-nowrap
							${
								filter === value
									? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
									: "bg-zinc-950/40 backdrop-blur-sm border border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
							}
						`}
					>
						{label}
					</Button>
				))}
			</div>

			{/* Post Cards */}
			<div className="flex flex-wrap -mx-1 gap-3 justify-center">
				{isLoading ? (
					<p className="w-full text-center text-zinc-300 mt-20">Loading...</p>
				) : posts.length > 0 ? (
					posts.map((post: Post) => (
						<div key={post._id}>
							<DashboardPostCard
								post={{
									_id: post._id,
									title: post.title,
									slug: post.slug.current,
									publishedAt: post.publishedAt,
									mainImageUrl: post.mainImage?.asset?.url,
									status: post.status,
									tags: post.tags,
								}}
								onDelete={(id) => handleDelete(id, post.mainImage?.asset?.url)}
								onArchive={handleArchive}
								onUnarchive={handleUnarchive}
							/>
						</div>
					))
				) : (
					<p className="w-full text-center text-gray-400">
						{noPostsMessages[filter]}
					</p>
				)}
			</div>
		</div>
	);
};

export default DashboardPage;
