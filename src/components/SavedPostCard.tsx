// src/components/SavedPostCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import Link from "next/link";
import { urlFor } from "@/lib/imageUrlBuilder";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";
import { cn } from "@/lib/utils"; // Ensure you have a utility for className concatenation

interface Author {
	name: string;
	image: string | null;
	username?: string; // Optional username
}

interface SavedPost {
	post: {
		_id: string;
		title: string;
		slug: {
			current: string;
		};
		mainImage?: {
			asset: {
				_ref: string;
			};
		};
		publishedAt: string;
		author: Author;
	};
	savedAt: string;
}

interface SavedPostCardProps {
	post: SavedPost;
}

const SavedPostCard: React.FC<SavedPostCardProps> = ({ post }) => {
	const router = useRouter();
	const { post: postData, savedAt } = post;

	const imageUrl = postData.mainImage?.asset?._ref
		? urlFor(postData.mainImage).url()
		: null; // Set to null if no image

	const handleView = () => {
		router.push(`/posts/${postData.slug.current}`);
	};

	const handleAuthorClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		const authorIdentifier = postData.author?.name
			?.toLowerCase()
			.replace(/\s+/g, "");
		if (authorIdentifier) {
			router.push(`/profile/${authorIdentifier}`);
		}
	};

	return (
		<CardContainer className="inter-var">
			<CardBody className="relative group/card bg-zinc-950/90 dark:hover:shadow-lg dark:hover:shadow-zinc-200/[0.1] border-zinc-800 w-80 sm:w-[21rem] h-[28rem] rounded-lg p-6 border transition-colors">
				{/* Post Title */}
				<CardItem
					translateZ={50}
					className="text-xl font-semibold text-zinc-100 tracking-tight cursor-pointer"
					onClick={handleView}
				>
					{postData.title}
				</CardItem>

				{/* Author Information */}
				<CardItem
					as="p"
					translateZ={60}
					className="text-zinc-400 text-sm max-w-sm mt-2"
				>
					{postData.author && (
						<button
							onClick={handleAuthorClick}
							className="text-zinc-300 hover:text-white transition-colors inline-block mr-2"
						>
							By @{postData.author.name}
						</button>
					)}
				</CardItem>

				{/* Post Image or Gradient */}
				<CardItem
					translateZ={100}
					className="w-full mt-4 h-48 overflow-hidden rounded-xl relative cursor-pointer"
					onClick={handleView} // Make the entire image area clickable
				>
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={postData.title}
							width={400}
							height={200}
							className="w-full h-full object-cover rounded-xl group-hover/card:shadow-xl transition-all duration-300"
							priority={true}
							onError={(e) => {
								(e.target as HTMLImageElement).src = "/default-thumbnail.jpg";
							}}
						/>
					) : (
						<BackgroundGradientAnimation className="rounded-xl" />
					)}
				</CardItem>

				{/* Publication and Save Date */}
				<div className="flex flex-col gap-2 mt-4">
					<CardItem as="p" translateZ={40} className="text-zinc-400 text-xs">
						Published: {new Date(postData.publishedAt).toLocaleDateString()}
					</CardItem>
					<CardItem as="p" translateZ={40} className="text-zinc-400 text-xs">
						Saved: {new Date(savedAt).toLocaleDateString()}
					</CardItem>
				</div>

				{/* Action Buttons */}
				<div className="flex justify-between items-center mt-6">
					{/* Read Post Link */}
					<CardItem
						translateZ={20}
						as={Link}
						href={`/posts/${postData.slug.current}`}
						className="text-xs text-zinc-400 hover:text-white transition-colors"
					>
						Read Post →
					</CardItem>

					{/* View Author Button */}
					{postData.author && (
						<CardItem
							translateZ={20}
							as={Link}
							href={`/profile/${postData.author.name.toLowerCase().replace(/\s+/g, "")}`}
							className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition-colors"
						>
							View Author
						</CardItem>
					)}
				</div>
			</CardBody>
		</CardContainer>
	);
};

export default SavedPostCard;
