// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/hooks/use-toast";
import DashboardPostCard from "@/components/DashboardPostCard";

interface Post {
	_id: string;
	title: string;
	slug: { current: string };
	publishedAt: string;
	mainImage?: { asset: { url: string; _ref: string } };
	status: "pending" | "published" | "draft" | "archived";
	tags?: string[];
}

const DashboardPage: React.FC = () => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [filter, setFilter] = useState<
		"published" | "drafts" | "archived" | "pending"
	>("published");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const router = useRouter();
	const { user, isLoaded } = useUser();
	const { toast } = useToast();

	const filterOptions: {
		label: string;
		value: "published" | "drafts" | "archived" | "pending";
	}[] = [
		{ label: "Published", value: "published" },
		{ label: "Pending", value: "pending" },
		{ label: "Drafts", value: "drafts" },
		{ label: "Archived", value: "archived" },
	];

	const noPostsMessages = {
		published: "No published posts found.",
		pending: "No posts are pending review.",
		drafts: "No drafts found.",
		archived: "No archived posts found.",
	};

	useEffect(() => {
		if (isLoaded && !user) {
			router.push("/signin");
		}
	}, [isLoaded, user, router]);

	useEffect(() => {
		if (!user) return;

		const fetchPosts = async () => {
			setIsLoading(true);
			try {
				let query = `*[_type == 'post' && author->clerk_id == $clerkId`;

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
					default:
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

				const data: Post[] = await client.fetch(query, { clerkId: user.id });
				setPosts(data);
			} catch (error) {
				console.error("Error fetching posts: ", error);
				toast({
					title: "Error",
					description: "Failed to fetch posts.",
				});
			}
			setIsLoading(false);
		};

		fetchPosts();
	}, [user, filter, toast]);

	const handleDelete = async (postId: string, imageUrl: string | undefined) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this post?"
		);
		if (!confirmDelete) return;

		setIsLoading(true);
		try {
			await client.delete(postId);
			setPosts(posts.filter((post) => post._id !== postId));
			toast({
				title: "Success",
				description: "Post deleted successfully!",
			});
		} catch (error) {
			console.error("Error deleting post: ", error);
			toast({
				title: "Error",
				description: "Failed to delete post.",
				variant: "destructive",
			});
		}
		setIsLoading(false);
	};

	const handleEdit = (slug: string | undefined) => {
		if (!slug) {
			console.error("Invalid slug provided");
			toast({
				title: "Error",
				description: "Invalid slug provided.",
				variant: "destructive",
			});
			return;
		}
		router.push(`/posts/edit/${slug}`);
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
			toast({
				title: "Success",
				description: "Post archived successfully!",
			});
		} catch (error) {
			console.error("Error archiving post: ", error);
			toast({
				title: "Error",
				description: "Failed to archive post.",
				variant: "destructive",
			});
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
			const updatedPost: Post = await client.fetch(
				`*[_type == 'post' && _id == $postId][0]`,
				{ postId }
			);
			setPosts([updatedPost, ...posts]);
			toast({
				title: "Success",
				description: "Post unarchived successfully!",
			});
			setFilter("published");
		} catch (error) {
			console.error("Error unarchiving post: ", error);
			toast({
				title: "Error",
				description: "Failed to unarchive post.",
				variant: "destructive",
			});
		}
		setIsLoading(false);
	};

	return (
		<div className="max-w-5xl mx-auto p-6 dark:text-white">
			<h1 className="text-4xl font-bold mb-6 text-center text-foreground">
				My Posts
			</h1>

			{/* Filter Buttons */}
			<div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-1 px-2">
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
								onEdit={handleEdit}
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
