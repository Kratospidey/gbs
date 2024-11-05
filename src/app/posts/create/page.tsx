// src/app/posts/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import client from "@/lib/sanityClient";
import { useUser } from "@clerk/nextjs";
import DarkModeToggle from "@/components/DarkModeToggle";
import TipTapEditor from "@/components/MarkdownEditor";
import { Tag } from "@/components/Tag";
import { useRouter } from "next/navigation";

const CreatePost: React.FC = () => {
	const { user, isLoaded } = useUser();
	const router = useRouter();

	// State declarations
	const [title, setTitle] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [mainImage, setMainImage] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [errors, setErrors] = useState<{
		title?: string;
		content?: string;
	}>({});

	// Auth check effect
	useEffect(() => {
		if (isLoaded && !user) {
			router.push("/signin");
		}
	}, [isLoaded, user, router]);

	// Loading state
	if (!isLoaded || !user) {
		return (
			<div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
				<div className="text-lg text-gray-600 dark:text-gray-300">
					Loading...
				</div>
			</div>
		);
	}

	const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const tag = tagInput.trim().toLowerCase();
			if (tag && !tags.includes(tag)) {
				setTags([...tags, tag]);
			}
			setTagInput("");
		}
	};

	const handleSubmit = async () => {
		if (!user) {
			alert("You need to be logged in to create a post.");
			return;
		}

		// Reset errors
		setErrors({});

		// Validate required fields
		const newErrors: { [key: string]: string } = {};

		if (!title.trim()) {
			newErrors.title = "Title is required";
		}
		if (!content.trim()) {
			newErrors.content = "Content is required";
		}

		// If there are errors, display them and stop submission
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsLoading(true);

		try {
			// 1. Upload image to Sanity if exists
			let imageAsset = null;
			if (mainImage) {
				imageAsset = await client.assets.upload("image", mainImage, {
					filename: mainImage.name,
					contentType: mainImage.type,
				});
			}

			// 2. Create/update author
			const authorDoc = {
				_type: "author",
				_id: user.id,
				name: user.username || user.firstName || "Anonymous",
				clerk_id: user.id,
			};

			await client.createOrReplace(authorDoc);

			// 3. Create post with all fields
			const slug = title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)/g, "");

			const newPost = {
				_type: "post",
				title,
				slug: { _type: "slug", current: slug },
				body: content,
				author: {
					_type: "reference",
					_ref: user.id,
				},
				mainImage: imageAsset
					? {
							_type: "image",
							asset: {
								_type: "reference",
								_ref: imageAsset._id,
							},
						}
					: null, // Handle case when no image is uploaded
				tags: tags,
				publishedAt: new Date().toISOString(),
				status: "pending",
			};

			await client.create(newPost);
			router.push("/dashboard");
		} catch (error: any) {
			console.error("Error creating post:", error);
			alert(error.message || "Failed to create post. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
			<DarkModeToggle />
			<Card className="dark:bg-gray-800 dark:border-gray-700">
				<CardHeader>
					<CardTitle className="dark:text-white">Create a New Post</CardTitle>
					<CardDescription className="dark:text-gray-300">
						Fill in the details to create a new blog post.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						{/* Title Field */}
						<div>
							<Label htmlFor="title" className="dark:text-white">
								Title *
							</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Enter post title"
								className={`dark:bg-gray-700 dark:text-white ${
									errors.title ? "border-red-500" : ""
								}`}
							/>
							{errors.title && (
								<span className="text-red-500 text-sm mt-1">
									{errors.title}
								</span>
							)}
						</div>

						{/* Content Field */}
						<div>
							<Label htmlFor="content" className="dark:text-white">
								Content *
							</Label>
							<div
								className={`prose-container border rounded-md p-4 dark:bg-gray-700 ${
									errors.content ? "border-red-500" : ""
								}`}
							>
								<TipTapEditor initialContent="" onChange={setContent} />
							</div>
							{errors.content && (
								<span className="text-red-500 text-sm mt-1">
									{errors.content}
								</span>
							)}
						</div>

						{/* Main Image Field */}
						<div>
							<Label htmlFor="mainImage" className="dark:text-white">
								Main Image
							</Label>
							<Input
								type="file"
								accept="image/*"
								onChange={(e) => {
									if (e.target.files?.[0]) {
										setMainImage(e.target.files[0]);
									}
								}}
								className="dark:bg-gray-700 dark:text-white"
							/>
						</div>

						{/* Tags Field */}
						<div className="mb-4">
							<label className="block mb-2">Tags</label>
							<div className="flex flex-wrap mb-2">
								{tags.map((tag) => (
									<Tag
										key={tag}
										text={tag}
										isEditable={true}
										onClick={() => setTags(tags.filter((t) => t !== tag))}
									/>
								))}
							</div>
							<input
								type="text"
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyDown={handleTagInput}
								placeholder="Add tags (press Enter or comma to add)"
								className="w-full p-2 border rounded"
							/>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						onClick={handleSubmit}
						disabled={isLoading}
						className="dark:bg-gray-700 dark:text-white"
					>
						{isLoading ? "Submitting..." : "Submit"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default CreatePost;
