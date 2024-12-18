// src/app/profile/[username]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkPreview } from "@/components/ui/link-preview";
import ProfilePostCard from "@/components/ProfilePostCard";
import { useToast } from "@/components/hooks/use-toast";

interface UserProfile {
	firstName: string;
	lastName: string;
	bio: any[]; // Updated to match the API response
	profilePicture?: string;
	github?: string;
	linkedin?: string;
	website?: string;
	name: string;
	email: string;
}

interface Author {
	username: string;
	firstName: string;
	lastName: string;
}

interface UserPost {
	_id: string;
	title: string;
	slug: string;
	publishedAt: string;
	mainImageUrl?: string;
	status: "pending" | "published" | "draft" | "archived";
	tags?: string[];
	author: Author;
}

const UserProfilePage = () => {
	const { username } = useParams();
	const [user, setUser] = useState<UserProfile | null>(null);
	const [posts, setPosts] = useState<UserPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				// Fetch user profile information
				const resUser = await fetch(`/api/users?username=${username}`);
				const userData = await resUser.json();

				if (!resUser.ok) throw new Error(userData.error);

				setUser({
					...userData.user.user,
					firstName: userData.user.user.firstName || "",
					lastName: userData.user.user.lastName || "",
					email: userData.user.user.email || "",
					profilePicture: userData.user.user.imageUrl || "",
				});

				// Fetch all posts
				const resPosts = await fetch(`/api/posts`);
				const postsData = await resPosts.json();

				if (!resPosts.ok) throw new Error("Failed to fetch posts.");

				// Filter posts by author's username
				const filteredPosts: UserPost[] = postsData.posts
					.filter((post: any) => post.author.username === username)
					.map((post: any) => ({
						_id: post._id,
						title: post.title,
						slug: post.slug,
						publishedAt: post.publishedAt || new Date().toISOString(),
						mainImageUrl: post.mainImageUrl || undefined,
						status: post.status || "published",
						tags: post.tags || [],
						author: {
							username: post.author.username || username,
							firstName: post.author.firstName || "",
							lastName: post.author.lastName || "",
						},
					}));

				setPosts(filteredPosts);
			} catch (error) {
				console.error("Error:", error);
				toast({
					title: "Error",
					description: "Failed to load profile.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		if (username) {
			fetchProfile();
		}
	}, [username, toast]);

	if (isLoading)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg text-gray-600 dark:text-gray-300">
					Loading...
				</div>
			</div>
		);

	if (!user)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg text-gray-600 dark:text-gray-300">
					User not found
				</div>
			</div>
		);

	return (
		<div className="min-h-screen px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto p-6">
				<div className="flex items-center space-x-6 mb-8">
					<Avatar className="h-24 w-24">
						<AvatarImage
							src={user.profilePicture || "/default-avatar.png"}
							alt={`${user.firstName} ${user.lastName}`}
						/>
						<AvatarFallback>
							{user.name ? user.name.charAt(0).toUpperCase() : "U"}
						</AvatarFallback>
					</Avatar>

					<div className="space-y-4">
						<div>
							<h2 className="text-3xl font-bold text-foreground">{`${user.firstName || "First"} ${user.lastName || "Last"}`}</h2>
							<p className="text-muted-foreground">@{user.name}</p>
						</div>

						{/* Render bio properly */}
						<div className="text-foreground">
							{user.bio.map((block) => (
								<p key={block._key}>
									{block.children.map((child: any) => child.text).join("")}
								</p>
							))}
						</div>

						<div className="flex gap-3">
							{user.github && (
								<LinkPreview url={user.github}>
									<Button
										variant="outline"
										size="icon"
										className="text-zinc-500 hover:text-zinc-700 p-2"
									>
										<FaGithub className="h-5 w-5" />
									</Button>
								</LinkPreview>
							)}

							{user.linkedin && (
								<LinkPreview url={user.linkedin}>
									<Button
										variant="outline"
										size="icon"
										className="text-zinc-500 hover:text-zinc-700 p-2"
									>
										<FaLinkedin className="h-5 w-5" />
									</Button>
								</LinkPreview>
							)}

							{user.website && (
								<LinkPreview url={user.website}>
									<Button
										variant="outline"
										size="icon"
										className="text-zinc-500 hover:text-zinc-700 p-2"
									>
										<FaGlobe className="h-5 w-5" />
									</Button>
								</LinkPreview>
							)}

							<Button
								variant="outline"
								size="icon"
								className="text-zinc-500 hover:text-zinc-700 p-2"
								asChild
							>
								<a href={`mailto:${user.email}`} title={user.email}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="h-5 w-5 text-zinc-500 hover:text-zinc-700"
									>
										<rect width="20" height="16" x="2" y="4" rx="2" />
										<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
									</svg>
								</a>
							</Button>
						</div>
					</div>
				</div>

				{/* User's Published Posts */}
				<div className="mt-8">
					<h3 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100 text-center">
						Published Posts
					</h3>
					{posts.length === 0 ? (
						<p className="text-zinc-600 dark:text-zinc-400">
							No published posts yet.
						</p>
					) : (
						<div className="flex flex-wrap -mx-1 gap-3 justify-center">
							{posts.map((post) => (
								<div key={post._id}>
									<ProfilePostCard post={post} />
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default UserProfilePage;
