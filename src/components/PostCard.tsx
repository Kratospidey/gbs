// src/components/PostCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Tag } from "@/components/Tag";
import { urlFor } from "@/lib/imageUrlBuilder";
import Image from "next/image";

interface Slug {
	current: string;
}

interface Asset {
	_ref?: string;
	url?: string;
}

interface MainImage {
	asset: Asset;
}

interface Author {
	name: string;
}

interface Post {
	_id: string;
	title: string;
	slug: Slug;
	publishedAt: string;
	mainImage?: MainImage;
	status: "pending" | "published" | "draft" | "archived";
	tags?: string[];
	description?: string;
	author: Author;
}

interface PostCardProps {
	post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
	// Generate the image URL or use the default image
	const imageUrl = post.mainImage?.asset?.url
		? post.mainImage.asset.url
		: post.mainImage?.asset?._ref
			? urlFor(post.mainImage).url()
			: "/default-post.png";

	// For debugging purposes
	console.log("Image URL:", imageUrl);

	return (
		<Link href={`/posts/${post.slug.current}`} className="block">
			<div className="group relative neomorph-card p-6">
				{/* Image */}
				<div className="cursor-pointer">
					{imageUrl && (
						<Image
							src={imageUrl}
							width={250}
							height={250}
							alt={post.title}
							className="w-full h-48 object-cover mb-4 rounded-md shadow-sm transition-transform transform hover:scale-105"
						/>
					)}
					{/* Post Details */}
					<div className="text-center">
						<h2 className="text-xl font-bold text-card-foreground mb-2">
							{post.title}
						</h2>
						{post.description && (
							<p className="mt-2 text-sm text-gray-600">{post.description}</p>
						)}
						<div className="mt-2 flex items-center justify-center text-sm text-gray-500">
							<span>{post.author.name}</span>
							<span className="mx-2">•</span>
							<span>{new Date(post.publishedAt).toLocaleDateString()}</span>
						</div>
					</div>
				</div>
				{/* Tags */}
				<div className="flex flex-wrap mt-2">
					{post.tags?.map((tag) => <Tag key={tag} text={tag} />)}
				</div>
			</div>
		</Link>
	);
};

export default PostCard;
