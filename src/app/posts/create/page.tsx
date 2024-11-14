// src/app/create/page.tsx

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
import { Separator } from "@/components/ui/separator";
import client from "@/lib/sanityClient";
import { useUser } from "@clerk/nextjs";
import TipTapEditor from "@/components/MarkdownEditor";
import { Tag } from "@/components/Tag";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons.tsx";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/hooks/use-toast"; // Import useToast

const CreatePost: React.FC = () => {
	const { user, isLoaded } = useUser();
	const router = useRouter();
	const { toast } = useToast(); // Get the toast function

	const [title, setTitle] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [mainImage, setMainImage] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [errors, setErrors] = useState<{
		title?: string;
		tags?: string;
		content?: string;
	}>({});

	useEffect(() => {
		if (isLoaded && !user) {
			router.push("/signin");
		}
	}, [isLoaded, user, router]);

	if (!isLoaded || !user) {
		// Return loading UI or null
		return (
			<div className="min-h-screen flex items-center justify-center">
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
			const tagRegex = /^[A-Za-z0-9-]+$/;
			if (tag && !tags.includes(tag)) {
				if (tagRegex.test(tag)) {
					setTags([...tags, tag]);
					setErrors((prev) => ({ ...prev, tags: undefined }));
				} else {
					setErrors((prev) => ({
						...prev,
						tags: "Tags can only contain alphanumeric characters and hyphens.",
					}));
				}
			}
			setTagInput("");
		}
	};

	const handleSubmit = async (status: string) => {
		if (!user) {
			toast({
				title: "Error",
				description: "You need to be logged in to create a post.",
				variant: "destructive",
			});
			return;
		}

		setErrors({});
		const newErrors: { title?: string; tags?: string; content?: string } = {};

		const titleRegex = /^[A-Za-z0-9- ]+$/;
		if (!title.trim()) {
			newErrors.title = "Title is required";
		} else if (!titleRegex.test(title)) {
			newErrors.title =
				"Title can only contain alphanumeric characters and hyphens.";
		}

		const tagRegex = /^[A-Za-z0-9-]+$/;
		for (const tag of tags) {
			if (!tagRegex.test(tag)) {
				newErrors.tags =
					"All tags must contain only alphanumeric characters and hyphens.";
				break;
			}
		}

		if (!content.trim()) {
			newErrors.content = "Content is required";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsLoading(true);

		try {
			const slug = title
				.toLowerCase()
				.replace(/[^a-z0-9-]+/g, "-")
				.replace(/(^-|-$)/g, "");

			// Slug Uniqueness Check
			const existingPostWithSlug = await client.fetch(
				`*[_type == "post" && slug.current == $slug][0]`,
				{ slug }
			);

			if (existingPostWithSlug) {
				toast({
					title: "Error",
					description:
						"A post with this title already exists. Please choose a different title.",
					variant: "destructive",
				});
				setIsLoading(false);
				return;
			}

			let imageAsset = null;
			if (mainImage) {
				imageAsset = await client.assets.upload("image", mainImage, {
					filename: mainImage.name,
					contentType: mainImage.type,
				});
			}

			// Fetch the author document where clerk_id matches the user.id
			const existingAuthor = await client.fetch(
				`*[_type == "author" && clerk_id == $clerkId][0]`,
				{ clerkId: user.id }
			);

			let authorId;

			if (existingAuthor) {
				// Use existing author document's _id
				authorId = existingAuthor._id;
			} else {
				// Create a new author document
				authorId = uuidv4(); // Generate a unique ID

				const authorDoc = {
					_type: "author",
					_id: authorId,
					name: user.username || user.firstName || "Anonymous",
					clerk_id: user.id,
					firstName: user.firstName || "",
					lastName: user.lastName || "",
					email:
						user.emailAddresses[0]?.emailAddress ||
						user.primaryEmailAddressId ||
						"",
					// Include other fields as necessary
				};

				await client.create(authorDoc);
			}

			// Set the final status
			const finalStatus = status === "published" ? "pending" : status;

			// Create the new post
			const newPost: any = {
				_type: "post",
				title,
				slug: { _type: "slug", current: slug },
				body: {
					_type: "markdown",
					content: content, // Content from TipTapEditor should already be markdown
				},
				author: {
					_type: "reference",
					_ref: authorId,
				},
				tags: tags,
				publishedAt: new Date().toISOString(),
				status: finalStatus,
				// Conditionally include mainImage if imageAsset exists
				...(imageAsset && {
					mainImage: {
						_type: "image",
						asset: {
							_type: "reference",
							_ref: imageAsset._id,
						},
					},
				}),
			};

			await client.create(newPost);
			toast({
				title: "Success",
				description: "Post created successfully!",
			});
			router.push("/dashboard");
		} catch (error: any) {
			console.error("Error creating post:", error);
			toast({
				title: "Error",
				description:
					error.message || "Failed to create post. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="container max-w-4xl mx-auto p-6">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Create Post</h1>
					<p className="text-sm text-muted-foreground">
						Create and publish a new blog post
					</p>
				</div>
			</div>
			<Separator className="my-6" />

			<Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
				<CardHeader className="backdrop-blur-xl">
					<CardTitle className="text-xl font-semibold">Post Details</CardTitle>
					<CardDescription>
						Fill in the information below to create your post
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
							placeholder="Enter your post title"
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
							<TipTapEditor initialContent="" onChange={setContent} />
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
						{errors.tags && (
							<p className="text-sm text-red-500">{errors.tags}</p>
						)}
					</div>
				</CardContent>

				<CardFooter className="flex justify-end space-x-4 pt-6">
					<Button
						variant="outline"
						onClick={() => handleSubmit("draft")}
						disabled={isLoading}
						className="h-9 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
					>
						{isLoading ? (
							<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Icons.draft className="mr-2 h-4 w-4" />
						)}
						Save Draft
					</Button>
					<Button
						onClick={() => handleSubmit("published")}
						disabled={isLoading}
						className="h-9 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900"
					>
						{isLoading ? (
							<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Icons.publish className="mr-2 h-4 w-4" />
						)}
						Publish
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default CreatePost;
