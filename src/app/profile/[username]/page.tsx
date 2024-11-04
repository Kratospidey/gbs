// src/app/profile/[username]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import Link from "next/link";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

// Update UserProfile interface to match Supabase columns
interface UserProfile {
	user_id: string;
	first_name: string;
	last_name: string;
	email: string;
	bio: string;
	profile_picture?: string;
	github?: string;        // matches Supabase column
	linkedin?: string;      // matches Supabase column
	custom_link?: string;   // matches Supabase column
	username: string;
}

interface UserPost {
	id: string;
	title: string;
	created_at: string;
	image_url?: string;
	slug: string;
}

const UserProfilePage = () => {
	const { username } = useParams();
	const [user, setUser] = useState<UserProfile | null>(null);
	const [posts, setPosts] = useState<UserPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { theme, setTheme } = useTheme();

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				console.log("Fetching profile for:", username); // Debug log

				const res = await fetch(`/api/profile/${username}`);
				const data = await res.json();

				console.log("API Response:", data); // Debug log

				if (!res.ok) throw new Error(data.error);

				setUser(data.user);
				setPosts(data.posts);
			} catch (error) {
				console.error("Error:", error);
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
				Loading...
			</div>
		);
	if (!user)
		return (
			<div className="min-h-screen flex items-center justify-center">
				User not found
			</div>
		);

	return (
		<div className="min-h-screen bg-background">
			<div className="absolute top-4 right-4">
				<ModeToggle />
			</div>
			<div className="container max-w-4xl mx-auto px-4 py-12">
				<div className="flex items-center space-x-6 mb-8">
					<Avatar className="h-24 w-24">
						<AvatarImage
							src={
								user.profile_picture ||
								"/default-avatar.png"
							}
							alt={user.first_name}
						/>
						<AvatarFallback>
							{user?.first_name?.charAt(0).toUpperCase() || "U"}
						</AvatarFallback>
					</Avatar>
					
					<div className="space-y-4">
						<div>
							<h2 className="text-3xl font-bold text-foreground">
								 {`${user.first_name} ${user.last_name}`}
							</h2>
							<p className="text-muted-foreground">@{user.username}</p>
						</div>
						
						<p className="text-foreground">{user.bio}</p>
						
						<div className="flex gap-3">
							{user.github && (
								<Button variant="outline" size="icon" asChild>
									<a href={user.github} target="_blank" rel="noopener noreferrer">
										<FaGithub className="h-5 w-5" />
									</a>
								</Button>
							)}
							
							{user.linkedin && (
								<Button variant="outline" size="icon" asChild>
									<a href={user.linkedin} target="_blank" rel="noopener noreferrer">
										<FaLinkedin className="h-5 w-5" />
									</a>
								</Button>
							)}
							
							{user.custom_link && (
								<Button variant="outline" size="icon" asChild>
									<a href={user.custom_link} target="_blank" rel="noopener noreferrer">
										<FaGlobe className="h-5 w-5" />
									</a>
								</Button>
							)}
							
							<Button variant="outline" size="icon" asChild>
								<a href={`mailto:${user.email}`} title={user.email}>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
										<rect width="20" height="16" x="2" y="4" rx="2" />
										<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
									</svg>
								</a>
							</Button>
						</div>
					</div>
				</div>

				{/* User's Published Posts */}
				<div>
					<h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
						Published Posts
					</h3>
					{posts.length === 0 ? (
						<p className="text-gray-600 dark:text-gray-400">
							No published posts yet.
						</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{posts.map((post) => (
								<Link key={post.id} href={`/posts/${post.slug}`}>
									<div className="border bg-card text-card-foreground rounded-lg shadow-sm hover:shadow-md transition-shadow">
										<img
											src={post.image_url}
											alt={post.title}
											className="w-full h-48 object-cover rounded-t-lg"
										/>
										<div className="p-4">
											<h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
												{post.title}
											</h4>
											<p className="text-gray-600 dark:text-gray-400 mt-2">
												{new Date(post.created_at).toLocaleDateString()}
											</p>
										</div>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default UserProfilePage;
