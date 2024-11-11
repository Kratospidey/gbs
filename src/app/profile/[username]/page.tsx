// src/app/profile/[username]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkPreview } from "@/components/ui/link-preview";
import ProfilePostCard from "@/components/ProfilePostCard"; // Updated import
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface UserProfile {
	user_id: string;
	first_name: string;
	last_name: string;
	email: string;
	bio: string;
	profile_picture?: string;
	github?: string;
	linkedin?: string;
	custom_link?: string;
	username: string;
}

// Update UserPost interface to match expected Author type
interface UserPost {
	_id: string;
	title: string;
	slug: string;
	publishedAt: string;
	mainImageUrl?: string;
	status: "pending" | "published" | "draft" | "archived";
	tags?: string[];
	author?: {
		username: string;
		firstName: string; // Added
		lastName: string; // Added
		clerk_id: string;
	};
}

const UserProfilePage = () => {
	const { username } = useParams();
	const [user, setUser] = useState<UserProfile | null>(null);
	const [posts, setPosts] = useState<UserPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await fetch(`/api/profile/${username}`);
				const data = await res.json();

				if (!res.ok) throw new Error(data.error);

				// Add username from URL to user object
				setUser({
					...data.user,
					username: username as string, // Add username from URL params
				});

				const filteredPosts: UserPost[] = data.posts
					.filter((post: any) => post.status === "published")
					.map((post: any) => ({
						_id: post._id,
						title: post.title,
						slug: post.slug,
						publishedAt: post.publishedAt || new Date().toISOString(),
						mainImageUrl: post.mainImageUrl || "/default-thumbnail.jpg",
						status: post.status || "published",
						tags: post.tags || [],
						author: {
							username: post.author?.username || (username as string),
							firstName: data.user.first_name,
							lastName: data.user.last_name,
							clerk_id: post.author?.clerk_id,
						},
					}));

				setPosts(filteredPosts);
			} catch (error) {
				console.error("Error:", error);
				toast.error("Failed to load profile.");
			} finally {
				setIsLoading(false);
			}
		};

		if (username) {
			fetchProfile();
		}
	}, [username]);

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
			<ToastContainer />
			<div className="max-w-7xl mx-auto p-6">
				<div className="flex items-center space-x-6 mb-8">
					<Avatar className="h-24 w-24">
						<AvatarImage
							src={user.profile_picture || "/default-avatar.png"}
							alt={`${user.first_name} ${user.last_name}`}
						/>
						<AvatarFallback>
							{user?.first_name?.charAt(0).toUpperCase() || "U"}
						</AvatarFallback>
					</Avatar>

					<div className="space-y-4">
						<div>
							<h2 className="text-3xl font-bold text-foreground">{`${user.first_name} ${user.last_name}`}</h2>
							<p className="text-muted-foreground">@{user.username}</p>
						</div>

						<p className="text-foreground">{user.bio}</p>

						<div className="flex gap-3">
							{user.github && (
								<Button
									variant="outline"
									size="icon"
									className="text-zinc-500 hover:text-zinc-700 p-2"
									asChild
								>
									<LinkPreview url={user.github}>
										<FaGithub className="h-5 w-5 text-zinc-500 hover:text-zinc-700" />
									</LinkPreview>
								</Button>
							)}

							{user.linkedin && (
								<Button
									variant="outline"
									size="icon"
									className="text-zinc-500 hover:text-zinc-700 p-2"
									asChild
								>
									<LinkPreview url={user.linkedin}>
										<FaLinkedin className="h-5 w-5 text-zinc-500 hover:text-zinc-700" />
									</LinkPreview>
								</Button>
							)}

							{user.custom_link && (
								<Button
									variant="outline"
									size="icon"
									className="text-zinc-500 hover:text-zinc-700 p-2"
									asChild
								>
									<LinkPreview url={user.custom_link}>
										<FaGlobe className="h-5 w-5 text-zinc-500 hover:text-zinc-700" />
									</LinkPreview>
								</Button>
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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 place-items-center">
							{posts.map((post) => (
								<ProfilePostCard key={post._id} post={post} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default UserProfilePage;
