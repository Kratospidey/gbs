// src/components/DashboardPostCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import { cn } from "@/lib/utils"; // Ensure you have a utility for className concatenation
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";

const commonCardBody = cn(`
  relative group/card 
  bg-zinc-950/90 
  dark:hover:shadow-lg 
  dark:hover:shadow-zinc-200/[0.1] 
  border-zinc-800 
  w-80 sm:w-[21rem] 
  h-[28rem] 
  rounded-lg 
  p-6 
  border 
  transition-colors
`);

const commonButton = cn(`
  px-4 py-2 
  rounded-md 
  bg-zinc-800 
  hover:bg-zinc-700 
  text-zinc-100 
  text-xs 
  font-medium 
  transition-colors
`);

const getStatusStyle = (status: Post["status"]) => {
	const baseStyle = cn(
		"px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
	);
	switch (status) {
		case "published":
			return cn(baseStyle, "bg-zinc-800 text-zinc-100");
		case "draft":
			return cn(baseStyle, "bg-zinc-900 text-zinc-400");
		case "pending":
			return cn(baseStyle, "bg-zinc-800 text-zinc-300");
		case "archived":
			return cn(baseStyle, "bg-zinc-900 text-zinc-500");
		default:
			return cn(baseStyle, "bg-zinc-900 text-zinc-400");
	}
};

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

interface DashboardPostCardProps {
	post: Post;
	onDelete: (id: string) => void;
	onArchive: (id: string) => void;
	onUnarchive: (id: string) => void;
	onEdit: (slug: string | undefined) => void; // Added onEdit prop
}

const DashboardPostCard: React.FC<DashboardPostCardProps> = ({
	post,
	onDelete,
	onArchive,
	onUnarchive,
	onEdit, // Destructure onEdit from props
}) => {
	const router = useRouter();
	const isArchived = post.status === "archived";
	const isPending = post.status === "pending";
	const isDraft = post.status === "draft";

	const handleEdit = () => {
		onEdit(post.slug); // Use the onEdit prop
	};

	const handleArchive = () => {
		onArchive(post._id);
	};

	const handleUnarchive = () => {
		onUnarchive(post._id);
	};

	const handleDelete = () => {
		onDelete(post._id);
	};

	const handleView = () => {
		if (post.status === "published") {
			router.push(`/posts/${post.slug}`);
		}
	};

	return (
		<CardContainer className="inter-var">
			<CardBody className={commonCardBody}>
				<div className="flex justify-between items-start mb-4">
					<CardItem
						translateZ={50}
						className="text-xl font-semibold text-zinc-100 tracking-tight cursor-pointer"
						onClick={handleView}
					>
						{post.title}
					</CardItem>
					<CardItem translateZ={20} className={getStatusStyle(post.status)}>
						{post.status.charAt(0).toUpperCase() + post.status.slice(1)}
					</CardItem>
				</div>
				<CardItem
					as="p"
					translateZ={60}
					className="text-gray-400 text-sm max-w-sm mt-2"
				>
					Published on {new Date(post.publishedAt).toLocaleDateString()}
				</CardItem>
				<CardItem
					translateZ={100}
					className="w-full mt-4 h-48 overflow-hidden rounded-xl relative"
				>
					{post.mainImageUrl ? (
						<Image
							src={post.mainImageUrl}
							alt={post.title}
							width={400}
							height={200}
							className="w-full h-full object-cover rounded-xl group-hover/card:shadow-xl"
						/>
					) : (
						<BackgroundGradientAnimation className="gradient-animation" />
					)}
				</CardItem>
				<div className="flex justify-around items-center mt-6">
					{!isArchived && (
						<Button
							onClick={handleEdit} // Use handleEdit which calls onEdit prop
							disabled={isPending}
							className={cn(
								"bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-50",
								"px-4 py-2 rounded-md text-xs font-medium transition-colors"
							)}
						>
							Edit
						</Button>
					)}
					{isArchived ? (
						<>
							<Button onClick={handleUnarchive} className={commonButton}>
								Unarchive
							</Button>
							<Button onClick={handleDelete} className={commonButton}>
								Delete
							</Button>
						</>
					) : (
						<>
							{!isDraft && (
								<Button
									onClick={handleArchive}
									disabled={isPending}
									className={cn(commonButton, "disabled:opacity-50")}
								>
									Archive
								</Button>
							)}
							<Button
								onClick={handleDelete}
								disabled={isPending}
								className={cn(commonButton, "disabled:opacity-50")}
							>
								Delete
							</Button>
						</>
					)}
				</div>
				<div className="mt-4 flex flex-wrap gap-2">
					{post.tags?.map((tag) => (
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
			</CardBody>
		</CardContainer>
	);
};

export default DashboardPostCard;
