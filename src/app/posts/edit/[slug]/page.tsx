// src/app/posts/edit/[slug]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import MarkdownEditor from "@/components/MarkdownEditor";
import { Tag } from "@/components/Tag";
import Image from "next/image";
import DarkModeToggle from "@/components/DarkModeToggle";

interface Post {
	_id: string;
	title: string;
	body: string;
	mainImage: {
		_type: "image";
		asset: {
			_ref: string;
			_type: "reference";
		};
	} | null;
	author: {
		_ref: string;
		_type: string;
	};
	publishedAt: string;
	tags: string[];
	status: string;
	_updatedAt: string;
}

interface EditPostProps {
	params: {
		slug: string;
	};
}

const EditPost: React.FC<EditPostProps> = ({ params }) => {
	const { user, isLoaded } = useUser();
	const router = useRouter();

	// State declarations
	const [title, setTitle] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [mainImage, setMainImage] = useState<File | null>(null);
	const [existingMainImageUrl, setExistingMainImageUrl] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [postId, setPostId] = useState<string>("");
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [currentStatus, setCurrentStatus] = useState<string>("draft"); // Added state for current status
	const [errors, setErrors] = useState<{ title?: string; content?: string }>(
		{}
	);

	// Auth check effect
	useEffect(() => {
		if (isLoaded && !user) {
			router.push(`/signin`);
		}
	}, [isLoaded, user, router, params.slug]);

	// Fetch post details
	useEffect(() => {
		const fetchPost = async () => {
			try {
				const fetchedPost = await client.fetch(
					`*[_type == "post" && slug.current == $slug][0] {
                    _id,
                    title,
                    body,
                    status,
                    mainImage {
                        asset-> {
                            _id,
                            url
                        }
                    },
                    tags,
                    "slug": slug.current,
                    _updatedAt
                }`,
					{ slug: params.slug }
				);

				if (fetchedPost) {
					setPostId(fetchedPost._id);
					setTitle(fetchedPost.title || "");
					setContent(fetchedPost.body || "");
					setTags(fetchedPost.tags || []);
					setCurrentStatus(fetchedPost.status || "draft");
					if (fetchedPost.mainImage?.asset?.url) {
						setExistingMainImageUrl(fetchedPost.mainImage.asset.url);
					}
				} else {
					alert("Post not found.");
					router.push("/");
				}
			} catch (error) {
				console.error("Error fetching post:", error);
				alert("Failed to fetch post");
				router.push("/posts");
			}
		};

		fetchPost();
	}, [params.slug, router]);

	// Handle tag input
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

	const handleSubmit = async (action: string) => {
		if (!user) {
			alert("You need to be logged in to edit a post.");
			return;
		}

		setErrors({});
		const newErrors: { [key: string]: string } = {};

		if (!title.trim()) {
			newErrors.title = "Title is required";
		}
		if (!content.trim()) {
			newErrors.content = "Content is required";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsLoading(true);
		let newImageAsset = null;

		// Handle main image upload if a new image is selected
		if (mainImage) {
			try {
				newImageAsset = await client.assets.upload("image", mainImage, {
					filename: mainImage.name,
					contentType: mainImage.type,
				});

				// Delete the existing image from Sanity
				if (existingMainImageUrl) {
					const existingAssetRef = existingMainImageUrl
						.split("/")
						.pop()
						?.split("-")
						.slice(0, 2)
						.join("-");
					if (existingAssetRef) {
						try {
							await client.delete(existingAssetRef);
							console.log(`Deleted existing image asset: ${existingAssetRef}`);
						} catch (deleteError) {
							console.error(
								`Failed to delete existing image asset: ${existingAssetRef}`,
								deleteError
							);
							// Optionally, notify the user but continue with the update
						}
					}
				}
			} catch (error: any) {
				console.error("Error uploading image to Sanity:", error);
				alert("Failed to upload main image. Please try again.");
				setIsLoading(false);
				return;
			}
		}

		// Determine the new status based on the action
		let newStatus = action === "published" ? "pending" : action;

		// Update the post in Sanity
		const updatedPost: Partial<Post> = {
			title: title,
			body: content, // 'content' contains markdown
			status: newStatus, // Set status to 'pending' if action is 'published'
			tags: tags, // Add tags
			// Only update mainImage if a new one is selected
			...(newImageAsset
				? {
						mainImage: {
							_type: "image",
							asset: {
								_type: "reference",
								_ref: newImageAsset._id,
							},
						},
					}
				: {}),
		};

		try {
			await client.patch(postId).set(updatedPost).commit();
			alert("Post updated successfully!");
			router.push(`/posts/${params.slug}`);
		} catch (error: any) {
			console.error("Failed to update post in Sanity:", error);
			alert("Failed to update post. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="container max-w-4xl mx-auto p-6">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
					<p className="text-sm text-muted-foreground">
						Modify and update your blog post
					</p>
				</div>
				<DarkModeToggle />
			</div>

			<Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
				<CardHeader className="backdrop-blur-xl">
					<CardTitle className="text-xl font-semibold">Post Details</CardTitle>
					<CardDescription>
						Update the information below to modify your post
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Title Field */}
					<div className="space-y-2">
						<Label htmlFor="title" className="text-sm font-medium">
							Title <span className="text-red-500">*</span>
						</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter post title"
							className={`h-10 border-zinc-200 dark:border-zinc-800 ${
								errors.title ? "border-red-500" : ""
							}`}
						/>
						{errors.title && (
							<p className="text-sm text-red-500">{errors.title}</p>
						)}
					</div>

					{/* Content Field */}
					<div className="space-y-2">
						<Label htmlFor="content" className="text-sm font-medium">
							Content <span className="text-red-500">*</span>
						</Label>
						<div
							className={`prose-container rounded-md border border-zinc-200 dark:border-zinc-800 ${
								errors.content ? "border-red-500" : ""
							}`}
						>
							<MarkdownEditor
								initialContent={content}
								onChange={(newContent) => setContent(newContent)}
							/>
						</div>
						{errors.content && (
							<p className="text-sm text-red-500">{errors.content}</p>
						)}
					</div>

					{/* Main Image Field */}
					<div className="space-y-2">
						<Label htmlFor="mainImage" className="text-sm font-medium">
							Featured Image
						</Label>
						<Input
							type="file"
							accept="image/*"
							onChange={(e) => {
								if (e.target.files?.[0]) {
									setMainImage(e.target.files[0]);
								}
							}}
							className="h-10 border-zinc-200 dark:border-zinc-800"
						/>
						{existingMainImageUrl && !mainImage && (
							<Image
								src={existingMainImageUrl}
								alt="Existing Main Image"
								width={250}
								height={250}
								className="mt-2 rounded-md"
							/>
						)}
						{mainImage && (
							<div className="mt-2">
								<p className="text-sm text-gray-600 dark:text-gray-300">
									New image selected: {mainImage.name}
								</p>
							</div>
						)}
					</div>

					{/* Tags Field */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">Tags</Label>
						<div className="flex flex-wrap gap-2 mb-2">
							{tags.map((tag) => (
								<Tag
									key={tag}
									text={tag}
									isEditable={true}
									onClick={() => setTags(tags.filter((t) => t !== tag))}
								/>
							))}
						</div>
						<Input
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={handleTagInput}
							placeholder="Add tags (press Enter or comma to add)"
							className="h-10 border-zinc-200 dark:border-zinc-800"
						/>
					</div>
				</CardContent>

				<CardFooter className="flex justify-end space-x-4 pt-6">
					<Button
						variant="outline"
						onClick={() => handleSubmit("draft")}
						disabled={isLoading}
						className={`h-9 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
							isLoading ? "cursor-not-allowed opacity-50" : ""
						}`}
					>
						{isLoading ? "Saving..." : "Save Draft"}
					</Button>
					<Button
						onClick={() => handleSubmit("published")}
						disabled={isLoading}
						className={`h-9 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 ${
							isLoading ? "cursor-not-allowed opacity-50" : ""
						}`}
					>
						{isLoading ? "Updating..." : "Submit for Review"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default EditPost;
