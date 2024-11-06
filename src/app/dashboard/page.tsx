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

// Define a specific type for filter
type StatusFilter = "published" | "pending" | "draft" | "archived";

// Type Guard for "archived"
const isArchived = (status: StatusFilter): status is "archived" =>
	status === "archived";

const DashboardPage: React.FC = () => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [filter, setFilter] = useState<StatusFilter>("published");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const router = useRouter();
	const { user, isLoaded } = useUser();

	// Define filter options with correct mapping
	const filterOptions: { label: string; value: StatusFilter }[] = [
		{ label: "Published", value: "published" },
		{ label: "Pending", value: "pending" },
		{ label: "Drafts", value: "draft" },
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
					case "draft":
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

			// Remove the unarchived post from the current list
			setPosts(posts.filter((post) => post._id !== postId));

			// If the current filter is "published", add the updated post to the list
			if (filter === "published") {
				setPosts((prevPosts) => [updatedPost, ...prevPosts]);
			}

			// Set the filter to "published" to display the unarchived post immediately
			setFilter("published");

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
			<h1 className="text-4xl font-bold mb-6 text-foreground">My Posts</h1>

			{/* Filter Buttons */}
			<div className="flex justify-center gap-6 mb-8">
				{filterOptions.map(({ label, value }) => (
					<Button
						key={label}
						onClick={() => setFilter(value)}
						className={`tab ${
							filter === value ? "tab-selected" : "tab-default"
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
							<div key={post._id} className="group relative neomorph-card p-6">
								{/* Clickable area for blog post */}
								<div
									onClick={() =>
										isClickable
											? router.push(`/posts/${post.slug.current}`)
											: null
									}
									className={`cursor-${
										isClickable ? "pointer" : "not-allowed"
									} ${!isClickable ? "opacity-70" : ""}`}
								>
									{post.mainImage?.asset?.url && (
										<Image
											src={post.mainImage.asset.url}
											alt={post.title}
											width={250}
											height={250}
											className={`w-full h-48 object-cover mb-4 rounded-md shadow-sm ${
												isClickable
													? "transition-transform transform hover:scale-105"
													: ""
											}`}
										/>
									)}
									<div className="text-center">
										<h2 className="text-xl font-bold text-card-foreground mb-2">
											{post.title}
											{post.status === "pending" && (
												<span className="ml-2 text-sm text-amber-500">
													(Pending Review)
												</span>
											)}
											{post.status === "draft" && (
												<span className="ml-2 text-sm text-gray-500">
													(Draft)
												</span>
											)}
										</h2>
										<p className="text-sm text-muted-foreground mb-4">
											{new Date(post.publishedAt).toLocaleDateString()}
										</p>
									</div>
								</div>

								{/* Button container with separate conditionals */}
								<div className="flex justify-center gap-4 mt-2">
									{/* Edit Button */}
									{!isArchived(post.status) && post.slug?.current && (
										<Button
											onClick={(e) => {
												e.stopPropagation();
												handleEdit(post.slug);
											}}
											disabled={post.status === "pending"}
											className="button-base bg-accent text-accent-foreground py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Edit
										</Button>
									)}

									{/* Unarchive and Delete Buttons for Archived Posts */}
									{isArchived(post.status) && (
										<>
											<Button
												onClick={(e) => {
													e.stopPropagation();
													handleUnarchive(post._id);
												}}
												className="bg-black text-white hover:bg-gray-700 py-2 px-6 rounded-md transition-colors"
											>
												Unarchive
											</Button>
											<Button
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(post._id, post.mainImage?.asset?.url);
												}}
												className="bg-black text-white hover:bg-gray-700 py-2 px-6 rounded-md transition-colors"
											>
												Delete
											</Button>
										</>
									)}

									{/* Archive Button for Non-Archived Posts */}
									{!isArchived(post.status) && (
										<Button
											onClick={(e) => {
												e.stopPropagation();
												handleArchive(post._id);
											}}
											disabled={post.status === "pending"}
											className="bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Archive
										</Button>
									)}

									{/* Delete Button for Non-Archived Posts */}
									{!isArchived(post.status) && (
										<Button
											onClick={(e) => {
												e.stopPropagation();
												handleDelete(post._id, post.mainImage?.asset?.url);
											}}
											disabled={post.status === "pending"}
											className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800 py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Delete
										</Button>
									)}
								</div>

								{/* Tags */}
								<div className="flex flex-wrap mt-2">
									{post.tags?.map((tag) => <Tag key={tag} text={tag} />)}
								</div>
							</div>
						);
					})
				) : (
					<p className="text-muted-foreground">
						No posts found. Create your first post!
					</p>
				)}
			</div>
		</div>
	);
};

export default DashboardPage;
