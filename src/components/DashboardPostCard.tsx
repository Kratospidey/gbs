// src/components/DashboardPostCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/Tag";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

interface DashboardPostCardProps {
	post: Post;
	onDelete: (id: string) => void;
	onArchive: (id: string) => void;
	onUnarchive: (id: string) => void;
}

const DashboardPostCard: React.FC<DashboardPostCardProps> = ({
	post,
	onDelete,
	onArchive,
	onUnarchive,
}) => {
	const router = useRouter();
	const isArchived = post.status === "archived";
	const isPending = post.status === "pending";
	const isDraft = post.status === "draft";

	const handleEdit = () => {
		router.push(`/posts/edit/${post.slug}`);
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
				<CardItem translateZ={100} className="w-full mt-4">
					<Image
						src={post.mainImageUrl || "/default-thumbnail.jpg"}
						alt={post.title}
						width={400}
						height={200}
						className="h-40 w-full object-cover rounded-xl group-hover/card:shadow-xl"
					/>
				</CardItem>
				<div className="flex justify-around items-center mt-6">
					{!isArchived && (
						<Button
							onClick={handleEdit}
							disabled={isPending}
							className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
						>
							Edit
						</Button>
					)}
					{isArchived ? (
						<>
							<Button
								onClick={handleUnarchive}
								className="bg-black text-white hover:bg-gray-700 px-4 py-2 rounded-md"
							>
								Unarchive
							</Button>
							<Button
								onClick={handleDelete}
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
							>
								Delete
							</Button>
						</>
					) : (
						<>
							{!isDraft && (
								<Button
									onClick={handleArchive}
									disabled={isPending}
									className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
								>
									Archive
								</Button>
							)}
							<Button
								onClick={handleDelete}
								disabled={isPending}
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
							>
								Delete
							</Button>
						</>
					)}
				</div>
				<div className="mt-4 flex flex-wrap gap-2">
					{post.tags?.map((tag) => (
						<Tag key={tag} text={tag} isEditable={false} />
					))}
				</div>
				<ToastContainer />
			</CardBody>
		</CardContainer>
	);
};

export default DashboardPostCard;
