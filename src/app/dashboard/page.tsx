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
			<div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
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
		<div className="max-w-5xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
			<ToastContainer />
			<DarkModeToggle />
			<h1 className="text-4xl font-bold mb-6 text-center text-foreground">
				My Posts
			</h1>

			{/* Filter Buttons */}
			<div className="flex justify-center gap-4 mb-8">
				{filterOptions.map(({ label, value }) => (
					<Button
						key={label}
						onClick={() => setFilter(value)}
						variant={filter === value ? "default" : "outline"}
						className={`px-4 py-2 rounded-md transition-colors ${
							filter === value
								? "bg-indigo-600 text-white"
								: "border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
						}`}
					>
						{label}
					</Button>
				))}
			</div>

			{/* Post Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{isLoading ? (
					<p className="text-center text-muted-foreground">Loading...</p>
				) : posts.length > 0 ? (
					posts.map((post: Post) => {
						const isClickable = post.status === "published";
						return (
							<div
								key={post._id}
								className="bg-gray-800 rounded-lg shadow-md overflow-hidden"
							>
								{/* Clickable area for blog post */}
								<div
									onClick={() =>
										isClickable
											? router.push(`/posts/${post.slug.current}`)
											: null
									}
									className={`cursor-${isClickable ? "pointer" : "not-allowed"} ${
										!isClickable ? "opacity-70" : ""
									}`}
								>
									{post.mainImage?.asset?.url && (
										<Image
											src={post.mainImage.asset.url}
											alt={post.title}
											width={400}
											height={200}
											className={`w-full h-48 object-cover ${
												isClickable
													? "transition-transform transform hover:scale-105"
													: ""
											}`}
										/>
									)}
									<div className="p-4">
										<h2 className="text-xl font-semibold text-white mb-2">
											{post.title}
											{post.status === "pending" && (
												<span className="ml-2 text-sm text-yellow-400">
													(Pending Review)
												</span>
											)}
											{post.status === "draft" && (
												<span className="ml-2 text-sm text-gray-400">
													(Draft)
												</span>
											)}
										</h2>
										<p className="text-sm text-gray-400">
											{new Date(post.publishedAt).toLocaleDateString()}
										</p>
									</div>
								</div>

								{/* Button container */}
								<div className="flex justify-around items-center p-4 border-t border-gray-700">
									{!isArchived(post.status) && post.slug?.current && (
										<Button
											onClick={(e) => {
												e.stopPropagation();
												handleEdit(post.slug);
											}}
											disabled={post.status === "pending"}
											className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Edit
										</Button>
									)}
									{isArchived(post.status) ? (
										<>
											<Button
												onClick={(e) => {
													e.stopPropagation();
													handleUnarchive(post._id);
												}}
												className="bg-black text-white hover:bg-gray-700 px-4 py-2 rounded-md"
											>
												Unarchive
											</Button>
											<Button
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(post._id, post.mainImage?.asset?.url);
												}}
												className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
											>
												Delete
											</Button>
										</>
									) : (
										<>
											<Button
												onClick={(e) => {
													e.stopPropagation();
													handleArchive(post._id);
												}}
												disabled={post.status === "pending"}
												className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Archive
											</Button>
											<Button
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(post._id, post.mainImage?.asset?.url);
												}}
												disabled={post.status === "pending"}
												className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Delete
											</Button>
										</>
									)}
								</div>

								{/* Tags */}
								<div className="p-4 pt-0">
									<div className="flex flex-wrap gap-2">
										{post.tags?.map((tag) => <Tag key={tag} text={tag} />)}
									</div>
								</div>
							</div>
						);
					})
				) : (
					<p className="text-center text-gray-400">
						No posts found. Create your first post!
					</p>
				)}
			</div>
		</div>
	);
};

export default DashboardPage;
