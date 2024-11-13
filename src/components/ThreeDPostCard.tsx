// src/components/ThreeDPostCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import { Tag } from "@/components/Tag";
import { useRouter } from "next/navigation";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation"; // Import the component
import { cn } from "@/lib/utils"; // Ensure you have a utility for className concatenation

interface Author {
	username: string;
	firstName: string;
	lastName: string;
}

interface Post {
	_id: string;
	title: string;
	slug: string;
	publishedAt: string;
	mainImageUrl?: string;
	status: "pending" | "published" | "draft" | "archived";
	tags?: string[];
	author?: Author;
}

const ThreeDPostCard: React.FC<{ post: Post }> = ({ post }) => {
	const router = useRouter();

	const handleAuthorClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (post.author) {
			router.push(`/profile/${post.author.username}`);
		}
	};

	const handleView = () => {
		if (post.status === "published") {
			router.push(`/posts/${post.slug}`);
		}
	};

	return (
		<CardContainer className="inter-var">
			<CardBody className="relative group/card bg-zinc-950/90 dark:hover:shadow-lg dark:hover:shadow-zinc-200/[0.1] border-zinc-800 w-80 sm:w-[21rem] min-h-[28rem] rounded-lg p-6 border transition-colors">
				{/* Post Title */}
				<CardItem
					translateZ={50}
					className="text-xl font-semibold text-zinc-100 tracking-tight cursor-pointer"
					onClick={handleView}
				>
					{post.title}
				</CardItem>

				{/* Publication Date and Author */}
				<CardItem
					as="p"
					translateZ={60}
					className="text-zinc-400 text-sm max-w-sm mt-2 font-light"
				>
					{new Date(post.publishedAt).toLocaleDateString()}
					{post.author && (
						<>
							{" · "}
							<button
								onClick={handleAuthorClick}
								className="text-zinc-300 hover:text-white transition-colors inline-block"
							>
								@{post.author.username}
							</button>
						</>
					)}
				</CardItem>

				{/* Post Image or Gradient */}
				<CardItem
					translateZ={100}
					className="w-full mt-4 h-48 overflow-hidden rounded-xl relative cursor-pointer"
					onClick={handleView} // Make the entire image area clickable
				>
					{post.mainImageUrl ? (
						<Image
							src={post.mainImageUrl}
							alt={post.title}
							width={400}
							height={200}
							className="w-full h-full object-cover rounded-xl group-hover/card:shadow-xl transition-all duration-300"
							priority={true}
							onError={(e) => {
								(e.target as HTMLImageElement).src = "/default-thumbnail.jpg";
							}}
						/>
					) : (
						<BackgroundGradientAnimation className="gradient-animation rounded-xl" />
					)}
				</CardItem>

				{/* Read More Button */}
				<div className="flex justify-center mt-6">
					<CardItem
						translateZ={20}
						as={Link}
						href={`/posts/${post.slug}`}
						className="text-xs text-zinc-400 hover:text-white transition-colors"
					>
						Read More →
					</CardItem>
				</div>

				{/* Tags */}
				{post.tags && post.tags.length > 0 && (
					<CardItem translateZ={20} className="mt-4">
						<div className="flex flex-wrap gap-2">
							{post.tags.map((tag) => (
								<Link href={`/tag/${tag}`} key={tag}>
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer">
										{tag}
									</span>
								</Link>
							))}
						</div>
					</CardItem>
				)}
			</CardBody>
		</CardContainer>
	);
};

export default ThreeDPostCard;
