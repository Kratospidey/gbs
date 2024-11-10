// src/components/ProfilePostCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tag } from "@/components/Tag";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";

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
			<CardBody className="relative group/card bg-zinc-950/90 dark:hover:shadow-lg dark:hover:shadow-zinc-200/[0.1] border-zinc-800 w-auto sm:w-[21rem] h-auto rounded-lg p-6 border transition-colors">
				<CardItem
					translateZ={50}
					className="text-xl font-semibold text-zinc-100 tracking-tight cursor-pointer"
					onClick={handleView}
				>
					{post.title}
				</CardItem>
				<CardItem
					as="p"
					translateZ={60}
					className="text-zinc-400 text-sm max-w-sm mt-2"
				>
					Published on {new Date(post.publishedAt).toLocaleDateString()}
				</CardItem>
				{post.mainImageUrl && (
					<CardItem translateZ={100} className="w-full mt-4">
						<Image
							src={post.mainImageUrl}
							alt={post.title}
							width={400}
							height={200}
							className="h-40 w-full object-cover rounded-md transition-all duration-300"
						/>
					</CardItem>
				)}
				<div className="mt-4 flex flex-wrap gap-2">
					{post.tags?.map((tag) => (
						<div
							key={tag}
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
			</CardBody>
		</CardContainer>
	);
};

export default ProfilePostCard;
