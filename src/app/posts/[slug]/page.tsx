// src/app/posts/[slug]/page.tsx
"use client";

import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import client from "@/lib/sanityClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowUp, Clock, Calendar, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { FaBookmark } from "react-icons/fa";
import { User2 } from "lucide-react";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Tag } from "@/components/Tag";
import { useUser } from "@clerk/nextjs";
import { nanoid } from "nanoid";
import Image from "next/image";
import Giscus from "@giscus/react";

interface Post {
	_id: string;
	title: string;
	status: string; // Added status field
	publishedAt: string;
	mainImage: {
		asset: {
			url: string;
		};
	};
	body: string;
	author: Author;
	estimatedReadingTime?: number;
	tags: string[];
}

interface Author {
	name: string;
	clerk_id?: string;
	profile_picture?: string;
	linkedin?: string;
	github?: string;
	website?: string;
}

interface PostDetail extends Post {
	body: string;
	author: Author;
	estimatedReadingTime?: number;
}

const getSupabaseImageUrl = (path: string | undefined) => {
	if (!path) return "/default-avatar.png";

	// If it's already a full URL, return it
	if (path.startsWith("http")) {
		return path;
	}

	// If it's a storage path, get the public URL
	const { data } = supabase.storage.from("user_pfp").getPublicUrl(path);
	return data?.publicUrl || "/default-avatar.png";
};

const PostDetailPage = () => {
	const { user } = useUser();
	const { slug } = useParams();
	const router = useRouter();
	const [post, setPost] = useState<PostDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaved, setIsSaved] = useState(false);

	useEffect(() => {
		const fetchPostAndSaveStatus = async () => {
			try {
				const data = await client.fetch(
					`
          *[_type == "post" && slug.current == $slug][0]{
            _id,
            title,
            status, // Added status
            body,
            publishedAt,
            mainImage{
              asset->{url}
            },
            "author": {
              "name": author->name,
              "clerk_id": author->_id, // Use _id since we're storing clerk_id there
              "profile_picture": author->profile_picture,
            },
            tags,
            "estimatedReadingTime": round(length(body) / 5 / 180 )
          }
        `,
					{ slug }
				);

				// Fetch author profile from Supabase
				if (data?.author?.clerk_id) {
					const { data: profileData, error } = await supabase
						.from("user_profiles")
						.select("profile_picture, user_id")
						.eq("user_id", data.author.clerk_id)
						.single();

					if (profileData?.profile_picture) {
						data.author = {
							...data.author,
							profile_picture: profileData.profile_picture,
						};
					}
				}

				setPost(data);

				// Only check saved status if both user and post exist
				if (user && data?._id) {
					const savedPostDoc = await client.fetch(
						`*[_type == "savedPost" && user == $userId && $postId in posts[].post._ref][0]`,
						{
							userId: user.id,
							postId: data._id,
						}
					);
					setIsSaved(!!savedPostDoc);
				}
			} catch (error) {
				console.error("Error fetching post:", error);
			}
			setIsLoading(false);
		};

		if (slug) {
			fetchPostAndSaveStatus();
		}
	}, [slug, user?.id, isSaved, user]);

	const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

	const addToList = async () => {
		if (!user) {
			toast.error("Please sign in to save posts");
			return;
		}

		if (!post) {
			toast.error("Post not found");
			return;
		}

		try {
			// Fetch the savedPost document for the user
			const savedPostDoc = await client.fetch(
				`*[_type == "savedPost" && user == $userId][0]`,
				{
					userId: user.id,
				}
			);

			if (savedPostDoc) {
				// Check if the post is already saved
				const postIndex = savedPostDoc.posts.findIndex(
					(p: any) => p.post._ref === post._id
				);

				if (postIndex > -1) {
					// Remove the post from the posts array
					await client
						.patch(savedPostDoc._id)
						.unset([`posts[${postIndex}]`])
						.commit();

					setIsSaved(false);
					toast.success("Removed from your saved posts!");
				} else {
					// Add the post to the posts array with a unique _key
					await client
						.patch(savedPostDoc._id)
						.append("posts", [
							{
								_key: nanoid(),
								post: {
									_type: "reference",
									_ref: post._id,
								},
								savedAt: new Date().toISOString(),
							},
						])
						.commit();

					setIsSaved(true);
					toast.success("Added to your saved posts!");
				}
			} else {
				// Create a new savedPost document for the user
				await client.create({
					_type: "savedPost",
					user: user.id,
					posts: [
						{
							_key: nanoid(),
							post: {
								_type: "reference",
								_ref: post._id,
							},
							savedAt: new Date().toISOString(),
						},
					],
				});

				setIsSaved(true);
				toast.success("Added to your saved posts!");
			}
		} catch (error) {
			console.error("Error saving post:", error);
			toast.error("Failed to save post");
		}
	};

	const sharePost = () => {
		navigator.clipboard.writeText(window.location.href);
		toast.success("Link copied to clipboard!");
	};

	if (isLoading)
		return (
			<div className="min-h-screen flex items-center justify-center">
				Loading...
			</div>
		);
	if (!post)
		return (
			<div className="min-h-screen flex items-center justify-center">
				Post not found
			</div>
		);
	if (post.status !== "published")
		return (
			<div className="min-h-screen flex items-center justify-center">
				Post not published
			</div>
		);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Hero Section */}
			<div className="relative h-[50vh] w-full">
				<div className="absolute inset-0">
					<Image
						src={post.mainImage?.asset?.url}
						alt={post.title}
						width={250}
						height={250}
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-black/50" />
				</div>
				<div className="relative h-full flex items-center justify-center">
					<h1 className="text-4xl md:text-6xl font-bold text-white text-center px-4">
						{post.title}
					</h1>
				</div>
			</div>

			{/* Content Container */}
			<div className="max-w-4xl mx-auto px-4 py-12">
				{/* Author and Meta Info */}
				<div className="flex items-center justify-between mb-8 border-b pb-8">
					<div className="flex items-center space-x-4">
						<Link href={`/profile/${post.author?.name?.toLowerCase()}`}>
							<Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
								<AvatarImage
									src={(() => {
										if (!post.author?.profile_picture)
											return "/default-avatar.png";

										// If it's already a full URL (from Supabase), use it directly
										if (post.author.profile_picture.startsWith("http")) {
											return post.author.profile_picture;
										}

										// If it's a relative path, construct Supabase URL
										const { data } = supabase.storage
											.from("user_pfp")
											.getPublicUrl(
												`public/${post.author.clerk_id}/${post.author.profile_picture}`
											);

										return data?.publicUrl || "/default-avatar.png";
									})()}
									alt={post.author?.name || "Author"}
								/>
								<AvatarFallback>
									{post.author?.name?.[0]?.toUpperCase() || "?"}
								</AvatarFallback>
							</Avatar>
						</Link>
						<div>
							<Link href={`/profile/${post.author?.name?.toLowerCase()}`}>
								<h3 className="font-medium text-gray-900 dark:text-gray-100 hover:underline cursor-pointer">
									{post.author?.name}
								</h3>
							</Link>
							<div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
								<span className="flex items-center">
									<Calendar className="w-4 h-4 mr-1" />
									{new Date(post.publishedAt).toLocaleDateString()}
								</span>
								<span className="flex items-center">
									<Clock className="w-4 h-4 mr-1" />
									{post.estimatedReadingTime} min read
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Post Content */}
				<div className="prose dark:prose-invert max-w-none">
					<ReactMarkdown
						className="prose dark:prose-invert"
						components={{
							h1: ({ node, ...props }) => (
								<h1 className="text-3xl font-bold mt-8 mb-4" {...props} />
							),
							h2: ({ node, ...props }) => (
								<h2 className="text-2xl font-bold mt-6 mb-3" {...props} />
							),
							p: ({ node, ...props }) => <p className="my-4" {...props} />,
							a: ({ node, ...props }) => (
								<a className="text-blue-500 hover:underline" {...props} />
							),
							code: ({ node, ...props }) => (
								<code
									className="bg-gray-100 dark:bg-gray-800 rounded px-1"
									{...props}
								/>
							),
						}}
					>
						{post.body}
					</ReactMarkdown>
				</div>
				<div className="flex flex-wrap mt-4">
					{post.tags?.map((tag) => <Tag key={tag} text={tag} />)}
				</div>

				{/* Giscus Comments */}
				<div className="mt-8">
					<section id="comments" className="prose dark:prose-invert">
						<h2>Comments</h2>
						<Giscus
							repo={
								process.env.NEXT_PUBLIC_GISCUS_REPO! as `${string}/${string}`
							}
							repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
							category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}
							categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
							mapping="pathname"
							reactionsEnabled="1"
							emitMetadata="0"
							theme={process.env.NEXT_PUBLIC_GISCUS_THEME!}
							lang={process.env.NEXT_PUBLIC_GISCUS_LANG!}
							loading="lazy"
						/>
					</section>
				</div>
			</div>
			<>
				{/* Right Side Navigation */}
				<div className="fixed right-8 bottom-8 flex flex-col space-y-2 z-50">
					<Button
						onClick={scrollToTop}
						variant="secondary"
						size="icon"
						className="p-2 rounded-full shadow-lg backdrop-blur-sm hover:scale-110 transition-transform"
					>
						<ArrowUp className="h-5 w-5" />
					</Button>
					<Button
						onClick={addToList}
						variant="secondary"
						size="icon"
						className={`p-2 rounded-full shadow-lg backdrop-blur-sm hover:scale-110 transition-transform ${
							isSaved ? "bg-primary text-primary-foreground" : ""
						}`}
					>
						<FaBookmark
							className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`}
						/>
					</Button>
					<Button
						onClick={sharePost}
						variant="secondary"
						size="icon"
						className="p-2 rounded-full shadow-lg backdrop-blur-sm hover:scale-110 transition-transform"
					>
						<Share2 className="h-5 w-5" />
					</Button>
				</div>
			</>
		</div>
	);
};

export default PostDetailPage;
