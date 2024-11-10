// src/components/ThreeDPostCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import { Tag } from "@/components/Tag";
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

interface ThreeDPostCardProps {
	post: Post;
}

export const ThreeDPostCard: React.FC<ThreeDPostCardProps> = ({ post }) => {
	const router = useRouter();

	return (
		<CardContainer className="inter-var">
			<CardBody className="relative group/card bg-zinc-950/90 dark:hover:shadow-lg dark:hover:shadow-zinc-200/[0.1] border-zinc-800 w-auto sm:w-[21rem] h-auto rounded-lg p-6 border transition-colors">
				<CardItem
					translateZ={50}
					className="text-xl font-semibold text-zinc-100 tracking-tight"
				>
					{post.title}
				</CardItem>
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
				<CardItem translateZ={100} className="w-full mt-4">
					<Image
						src={post.mainImageUrl || "/default-thumbnail.jpg"}
						height={1000}
						width={1000}
						className="h-40 w-full object-cover rounded-md transition-all duration-300"
						alt="thumbnail"
					/>
				</CardItem>
				<div className="flex justify-center mt-12">
					<CardItem
						translateZ={20}
						as={Link}
						href={`/posts/${post.slug}`}
						className="text-xs text-zinc-400 hover:text-white transition-colors"
					>
						Read More →
					</CardItem>
				</div>
				{post.tags && (
					<div className="mt-4 flex flex-wrap gap-2">
						{post.tags.map((tag) => (
							<div
								key={tag}
								onClick={() => router.push(`/tag/${tag}`)}
								className="cursor-pointer"
							>
								<CardItem
									translateZ={20}
									className="px-2 py-1 text-[10px] font-medium bg-zinc-900 text-zinc-400 rounded-md hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
								>
									{tag}
								</CardItem>
							</div>
						))}
					</div>
				)}
			</CardBody>
		</CardContainer>
	);
};
