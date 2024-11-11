// src/components/ProfilePostCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import { useRouter } from "next/navigation";

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

interface ProfilePostCardProps {
	post: Post;
}

const ProfilePostCard: React.FC<ProfilePostCardProps> = ({ post }) => {
	const router = useRouter();

	const handleView = () => {
		if (post.status === "published") {
			router.push(`/posts/${post.slug}`);
		}
	};

	return (
		<CardContainer className="inter-var">
			<CardBody className="relative group/card bg-zinc-950/90 dark:hover:shadow-lg dark:hover:shadow-zinc-200/[0.1] border-zinc-800 w-80 sm:w-[21rem] min-h-[28rem] rounded-lg p-6 border transition-colors">
				{/* Title */}
				<CardItem
					translateZ={50}
					className="text-xl font-semibold text-zinc-100 tracking-tight cursor-pointer"
					onClick={handleView}
				>
					{post.title}
				</CardItem>

				{/* Date and Author */}
				<CardItem
					as="p"
					translateZ={60}
					className="text-zinc-400 text-sm max-w-sm mt-2"
				>
					{new Date(post.publishedAt).toLocaleDateString()}
					{post.author && (
						<>
							{" · "}
							<button
								onClick={(e) => {
									e.stopPropagation();
									router.push(`/profile/${post.author!.username}`);
								}}
								className="text-zinc-300 hover:text-white transition-colors inline-block"
							>
								@{post.author.username}
							</button>
						</>
					)}
				</CardItem>

				{/* Image */}
				<CardItem translateZ={100} className="w-full mt-4 h-48">
					<Image
						src={post.mainImageUrl || "/default-thumbnail.jpg"}
						alt={post.title}
						width={400}
						height={200}
						className="w-full h-full object-cover rounded-md transition-all duration-300"
					/>
				</CardItem>

				{/* View More Link */}
				<div className="flex justify-center mt-6">
					<CardItem
						translateZ={20}
						as={Link}
						href={`/posts/${post.slug}`}
						className="text-xs text-zinc-400 hover:text-white transition-colors"
					>
						View More →
					</CardItem>
				</div>

				{/* Tags */}
				{post.tags && post.tags.length > 0 && (
					<CardItem translateZ={20} className="mt-4">
						<div className="flex flex-wrap gap-2">
							{post.tags.map((tag) => (
								<span
									key={tag}
									onClick={() => router.push(`/tag/${tag}`)}
									className="cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
								>
									{tag}
								</span>
							))}
						</div>
					</CardItem>
				)}
			</CardBody>
		</CardContainer>
	);
};

export default ProfilePostCard;
