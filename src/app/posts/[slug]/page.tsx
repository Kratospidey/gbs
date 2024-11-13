// src/app/posts/[slug]/page.tsx

"use client";

import client, { urlFor } from "@/lib/sanityClient";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowUp, Clock, Calendar, Share2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { FaBookmark } from "react-icons/fa";
import Link from "next/link";
import { Tag } from "@/components/Tag";
import { useUser } from "@clerk/nextjs";
import { nanoid } from "nanoid";
import Image from "next/image";
import Giscus from "@giscus/react";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import remarkGfm from "remark-gfm";
import { useToast } from "@/components/hooks/use-toast";

interface Post {
	_id: string;
	title: string;
	status: string;
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
	image?: {
		_type: "image";
		asset: {
			_ref: string;
			_type: "reference";
		};
	};
	linkedin?: string;
	github?: string;
	website?: string;
}

interface PostDetail extends Omit<Post, "body"> {
	body: {
		_type: "markdown";
		content: string;
	};
}

const PostDetailPage = () => {
	const { user } = useUser();
	const { slug } = useParams();
	const router = useRouter();
	const [post, setPost] = useState<PostDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaved, setIsSaved] = useState(false);
	const [isShared, setIsShared] = useState(false);

	const isDesktop = useIsDesktop();

	const [fetchError, setFetchError] = useState<string | null>(null);

	const { toast } = useToast();

	useEffect(() => {
		const fetchPostAndSaveStatus = async () => {
			try {
				const data = await client.fetch(
					`
          *[_type == "post" && slug.current == $slug][0]{
            _id,
            title,
            status,
            body{
              _type,
              content
            },
            publishedAt,
            mainImage{
              asset->{url}
            },
            "author": {
              "name": author->name,
              "clerk_id": author->clerk_id,
              "image": author->image,
            },
            tags,
            "estimatedReadingTime": round(length(body.content) / 5 / 180)
          }
          `,
					{ slug }
				);

				if (!data) {
					toast({
						title: "Error",
						description: "Post not found",
						variant: "destructive",
					});
					router.push("/");
					return;
				}

				if (!data.body || !data.body.content) {
					throw new Error("Post content is missing.");
				}

				if (data.status !== "published") {
					toast({
						title: "Error",
						description: "This post is not available.",
						variant: "destructive",
					});
					router.push("/");
					return;
				}

				setPost(data);

				if (user && data?._id) {
					// Fetch the author document for the current user
					const author = await client.fetch(
						`*[_type == "author" && clerk_id == $clerkId][0]`,
						{ clerkId: user.id }
					);

					if (author) {
						// Check if the post is saved
						const savedPostDoc = await client.fetch(
							`*[_type == "savedPost" && user._ref == $authorId && $postId in posts[].post._ref][0]`,
							{
								authorId: author._id,
								postId: data._id,
							}
						);
						setIsSaved(!!savedPostDoc);
					} else {
						setIsSaved(false);
					}
				} else {
					setIsSaved(false);
				}
			} catch (error: any) {
				console.error("Error fetching post:", error);
				setFetchError(
					error.message || "An error occurred while fetching the post."
				);
				router.push("/");
			}
			setIsLoading(false);
		};

		if (slug) {
			fetchPostAndSaveStatus();
		}
	}, [slug, user?.id, user, router, toast]); // Removed 'isSaved' from dependencies

	const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

	const addToList = async () => {
		if (!user) {
			toast({
				title: "Error",
				description: "Please sign in to save posts",
				variant: "destructive",
			});
			return;
		}

		if (!post) {
			toast({
				title: "Error",
				description: "Post not found",
				variant: "destructive",
			});
			return;
		}

		try {
			// Fetch the author document for the current user
			const author = await client.fetch(
				`*[_type == "author" && clerk_id == $clerkId][0]`,
				{ clerkId: user.id }
			);

			if (!author) {
				toast({
					title: "Error",
					description: "User profile not found.",
					variant: "destructive",
				});
				return;
			}

			// Check if a savedPost document exists for this user
			const savedPostDoc = await client.fetch(
				`*[_type == "savedPost" && user._ref == $authorId][0]`,
				{
					authorId: author._id,
				}
			);

			if (savedPostDoc) {
				const postIndex = savedPostDoc.posts.findIndex(
					(p: any) => p.post._ref === post._id
				);

				if (postIndex > -1) {
					// Remove the post from saved posts
					await client
						.patch(savedPostDoc._id)
						.unset([`posts[${postIndex}]`])
						.commit();

					setIsSaved(false);
					toast({
						title: "Success",
						description: "Removed from your saved posts!",
						variant: "default",
					});
				} else {
					// Add the post to saved posts
					await client
						.patch(savedPostDoc._id)
						.append("posts", [
							{
								_key: nanoid(),
								post: {
									_type: "reference",
									_ref: post._id,
									_weak: true,
								},
								savedAt: new Date().toISOString(),
							},
						])
						.commit();

					setIsSaved(true);
					toast({
						title: "Success",
						description: "Added to your saved posts!",
						variant: "default",
					});
				}
			} else {
				// Create a new savedPost document for the user
				await client.create({
					_type: "savedPost",
					user: {
						_type: "reference",
						_ref: author._id,
					},
					posts: [
						{
							_key: nanoid(),
							post: {
								_type: "reference",
								_ref: post._id,
								_weak: true,
							},
							savedAt: new Date().toISOString(),
						},
					],
				});

				setIsSaved(true);
				toast({
					title: "Success",
					description: "Added to your saved posts!",
					variant: "default",
				});
			}
		} catch (error) {
			console.error("Error saving post:", error);
			toast({
				title: "Error",
				description: "Failed to save post",
				variant: "destructive",
			});
		}
	};

	const sharePost = () => {
		navigator.clipboard.writeText(window.location.href);
		toast({
			title: "Success",
			description: "Link copied to clipboard!",
			variant: "default",
		});
		setIsShared(true);
		setTimeout(() => {
			setIsShared(false);
		}, 2000);
	};

	const FloatingButtons: React.FC = () => (
		<div
			className={`
        fixed bottom-8 flex flex-col space-y-2 z-50
        left-4 sm:left-8 md:left-auto md:right-8
      `}
		>
			<Button
				onClick={scrollToTop}
				variant="outline"
				size="icon"
				className="p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-lg backdrop-blur-sm hover:scale-110 transition-all"
			>
				<ArrowUp className="h-5 w-5" />
			</Button>
			<Button
				onClick={addToList}
				variant="outline"
				size="icon"
				className={`p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-lg backdrop-blur-sm hover:scale-110 transition-all ${
					isSaved
						? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
						: ""
				}`}
			>
				<FaBookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
			</Button>
			<Button
				onClick={sharePost}
				variant="outline"
				size="icon"
				className="p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-lg backdrop-blur-sm hover:scale-110 transition-all"
			>
				{isShared ? (
					<Check className="h-5 w-5 text-green-500" />
				) : (
					<Share2 className="h-5 w-5" />
				)}
			</Button>
		</div>
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
			</div>
		);
	}

	if (fetchError || !post) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-zinc-600 dark:text-zinc-400">
					{fetchError || "Post not found"}
				</div>
			</div>
		);
	}

	const Content = (
		<>
			{/* Hero Section */}
			<div className="relative h-[50vh] w-full">
				<div className="absolute inset-0">
					<Image
						src={urlFor(post.mainImage.asset.url).url()}
						alt={post.title}
						fill
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-black/50" />
				</div>
				<div className="absolute bottom-8 w-full flex justify-center px-4">
					<TextGenerateEffect words={post.title} filter={true} />
				</div>
			</div>

			{/* Content Container */}
			<div className="max-w-4xl mx-auto px-4 py-12">
				{/* Author and Meta Info */}
				<div className="flex items-center justify-between mb-8 border-b pb-8">
					<div className="flex items-center space-x-4">
						<Link href={`/profile/${post.author.name.toLowerCase()}`}>
							<Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
								<AvatarImage
									src={
										post.author.image?.asset?._ref
											? urlFor(post.author.image).url()
											: "/default-avatar.png"
									}
									alt={post.author.name || "Author"}
								/>
								<AvatarFallback>
									{post.author.name?.[0]?.toUpperCase() || "?"}
								</AvatarFallback>
							</Avatar>
						</Link>
						<div>
							<Link href={`/profile/${post.author.name.toLowerCase()}`}>
								<h3 className="font-medium text-gray-900 dark:text-gray-100 hover:underline cursor-pointer">
									{post.author.name}
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
				<div className="prose dark:prose-invert prose-zinc max-w-none">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						className="prose dark:prose-invert prose-zinc"
						components={{
							h1: ({ node, ...props }) => (
								<h1
									className="text-3xl font-bold mt-8 mb-4 text-zinc-900 dark:text-zinc-100"
									{...props}
								/>
							),
							h2: ({ node, ...props }) => (
								<h2
									className="text-2xl font-bold mt-6 mb-3 text-zinc-800 dark:text-zinc-200"
									{...props}
								/>
							),
							p: ({ node, ...props }) => (
								<p
									className="my-4 text-zinc-700 dark:text-zinc-300"
									{...props}
								/>
							),
							a: ({ node, ...props }) => (
								<a
									className="text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400 dark:decoration-zinc-600 hover:decoration-zinc-600 dark:hover:decoration-zinc-400 transition-all"
									{...props}
								/>
							),
							code: ({ node, ...props }) => (
								<code
									className="bg-zinc-100 dark:bg-zinc-800 rounded px-1"
									{...props}
								/>
							),
						}}
					>
						{post.body.content}
					</ReactMarkdown>
				</div>
				<div className="flex flex-wrap gap-2 mt-8">
					{post.tags.map((tag) => (
						<Tag key={tag} text={tag} />
					))}
				</div>

				{/* Comments Section */}
				<div className="mt-8">
					<section id="comments" className="prose dark:prose-invert">
						<h2>Comments</h2>
						{post && (
							<Giscus
								repo={
									process.env.NEXT_PUBLIC_GISCUS_REPO! as `${string}/${string}`
								}
								repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
								category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}
								categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
								mapping="specific"
								term={post._id} // Use the post's unique ID
								strict="1" // Optional: Set strict matching
								reactionsEnabled="1"
								emitMetadata="0"
								inputPosition="top" // Matches 'data-input-position="top"'
								theme="dark"
								lang="en"
								loading="lazy"
							/>
						)}
					</section>
				</div>
			</div>
			<FloatingButtons />
		</>
	);

	return isDesktop ? (
		<TracingBeam className="bg-white dark:bg-zinc-950">
			<>
				{/* Hero Section */}
				<div className="relative h-[50vh] w-full">
					<div className="absolute inset-0">
						<Image
							src={urlFor(post.mainImage.asset.url).url()}
							alt={post.title}
							fill
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px]" />
					</div>
					<div className="absolute bottom-8 w-full flex justify-center px-4">
						<TextGenerateEffect words={post.title} filter={true} />
					</div>
				</div>

				{/* Content Container */}
				<div className="max-w-4xl mx-auto px-4 py-12">
					{/* Author and Meta Info */}
					<div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-8">
						<div className="flex items-center space-x-4">
							<Link href={`/profile/${post.author.name.toLowerCase()}`}>
								<Avatar className="h-12 w-12 cursor-pointer ring-2 ring-zinc-100 dark:ring-zinc-800 transition-all hover:ring-4">
									<AvatarImage
										src={
											post.author.image?.asset?._ref
												? urlFor(post.author.image).url()
												: "/default-avatar.png"
										}
										alt={post.author.name || "Author"}
									/>
									<AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
										{post.author.name?.[0]?.toUpperCase() || "?"}
									</AvatarFallback>
								</Avatar>
							</Link>
							<div>
								<Link href={`/profile/${post.author.name.toLowerCase()}`}>
									<h3 className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
										{post.author.name}
									</h3>
								</Link>
								<div className="flex items-center space-x-4 text-sm text-zinc-500 dark:text-zinc-400">
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
					<div className="prose dark:prose-invert prose-zinc max-w-none">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							className="prose dark:prose-invert prose-zinc"
							components={{
								h1: ({ node, ...props }) => (
									<h1
										className="text-3xl font-bold mt-8 mb-4 text-zinc-900 dark:text-zinc-100"
										{...props}
									/>
								),
								h2: ({ node, ...props }) => (
									<h2
										className="text-2xl font-bold mt-6 mb-3 text-zinc-800 dark:text-zinc-200"
										{...props}
									/>
								),
								p: ({ node, ...props }) => (
									<p
										className="my-4 text-zinc-700 dark:text-zinc-300"
										{...props}
									/>
								),
								a: ({ node, ...props }) => (
									<a
										className="text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400 dark:decoration-zinc-600 hover:decoration-zinc-600 dark:hover:decoration-zinc-400 transition-all"
										{...props}
									/>
								),
								code: ({ node, ...props }) => (
									<code
										className="bg-zinc-100 dark:bg-zinc-800 rounded px-1"
										{...props}
									/>
								),
							}}
						>
							{post.body.content}
						</ReactMarkdown>
					</div>

					<div className="flex flex-wrap gap-2 mt-8">
						{post.tags.map((tag) => (
							<Tag key={tag} text={tag} />
						))}
					</div>

					{/* Comments Section */}
					<div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
						<section
							id="comments"
							className="prose dark:prose-invert prose-zinc"
						>
							<h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
								Comments
							</h2>
							<Giscus
								repo={
									process.env.NEXT_PUBLIC_GISCUS_REPO! as `${string}/${string}`
								}
								repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
								category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}
								categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
								mapping="specific"
								term={post._id} // Use the post's unique ID
								strict="1" // Optional: Set strict matching
								reactionsEnabled="1"
								emitMetadata="0"
								inputPosition="top" // Matches 'data-input-position="top"'
								theme="dark"
								lang="en"
								loading="lazy"
							/>
						</section>
					</div>
				</div>

				{/* Floating Action Buttons */}
				<FloatingButtons />
			</>
		</TracingBeam>
	) : (
		<div className="bg-white dark:bg-zinc-950">{Content}</div>
	);
};

export default PostDetailPage;
