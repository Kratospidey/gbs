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
			<CardBody className="bg-gray-800 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-[#1f2937] dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[21rem] h-auto rounded-xl p-6 border">
				<CardItem
					translateZ={50}
					className="text-xl font-semibold text-white cursor-pointer"
					onClick={handleView}
				>
					{post.title}
				</CardItem>
				<CardItem
					as="p"
					translateZ={60}
					className="text-gray-400 text-sm max-w-sm mt-2"
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
							className="h-40 w-full object-cover rounded-xl group-hover/card:shadow-xl"
						/>
					</CardItem>
				)}
				<div className="mt-4 flex flex-wrap gap-2">
					{post.tags?.map((tag) => (
						<Tag key={tag} text={tag} isEditable={false} />
					))}
				</div>
			</CardBody>
		</CardContainer>
	);
};

export default ProfilePostCard;
