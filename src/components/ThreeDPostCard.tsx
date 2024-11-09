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
			<CardBody className="bg-[#1f2937] relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-[#1f2937] dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[21rem] h-auto rounded-xl p-6 border">
				<CardItem
					translateZ={50}
					className="text-xl font-bold text-white"
				>
					{post.title}
				</CardItem>
				<CardItem
					as="p"
					translateZ={60}
					className="text-gray-300 text-sm max-w-sm mt-2"
				>
					Published on {new Date(post.publishedAt).toLocaleDateString()}
					{post.author && (
						<>
							{" by "}
							<button
								onClick={(e) => {
									e.stopPropagation();
									router.push(`/profile/${post.author!.username}`);
								}}
								className="text-blue-400 hover:underline inline-block"
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
						className="h-40 w-full object-cover rounded-xl group-hover/card:shadow-xl"
						alt="thumbnail"
					/>
				</CardItem>
				<div className="flex justify-between items-center mt-16">
					<CardItem
						translateZ={20}
						as={Link}
						href={`/posts/${post.slug}`}
						className="px-4 py-2 rounded-xl text-xs font-normal text-white"
					>
						Read More →
					</CardItem>
					<CardItem
						translateZ={20}
						as="button"
						onClick={() => router.push(`/signup`)}
						className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
					>
						Sign up
					</CardItem>
				</div>
				{post.tags && (
					<div className="mt-2 flex flex-wrap gap-2">
						{post.tags.map((tag) => (
							<div
								key={tag}
								onClick={() => router.push(`/tag/${tag}`)}
								className="cursor-pointer"
							>
								<Tag text={tag} isEditable={false} />
							</div>
						))}
					</div>
				)}
			</CardBody>
		</CardContainer>
	);
};
