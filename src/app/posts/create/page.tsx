// app/posts/create/page.tsx


"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import client from "@/lib/sanityClient";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { v4 as uuidv4 } from 'uuid'; // Import the uuid library
import DarkModeToggle from "@/components/DarkModeToggle";

// Dynamically import QuillEditor with ssr: false
const QuillEditor = dynamic(() => import("@/components/QuillEditor"), {
	ssr: false,
});

const CreatePost: React.FC = () => {
	const { user } = useUser();
	const [title, setTitle] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [mainImage, setMainImage] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async () => {
		if (!user) {
			alert("You need to be logged in to create a post.");
			return;
		}

		setIsLoading(true);
		let mainImageRef = "";

		// Check if user exists in Sanity
		try {
			const existingUser = await client.fetch(
				`*[_type == "author" && _id == $userId][0]`,
				{ userId: user.id }
			);

			// If the user does not exist, create the user in Sanity
			if (!existingUser) {
				const newUser = {
					_type: "author",
					_id: user.id,
					name: user.username || "Anonymous",
				};

				await client.create(newUser);
				console.log("User created in Sanity:", newUser);
			}
		} catch (error) {
			console.error("Error checking or creating user in Sanity:", error);
			alert("Failed to check or create user. Please try again.");
			setIsLoading(false);
			return;
		}

		// Handle image upload to Supabase and Sanity
		if (mainImage) {
			try {
				const { data: uploadData, error: uploadError } = await supabase.storage
					.from("post_banners")
					.upload(`public/${mainImage.name}`, mainImage, {
						cacheControl: "3600",
						upsert: true,
					});

				if (uploadError) {
					console.error("Error uploading image to Supabase:", uploadError);
					alert("Failed to upload image. Please try again.");
					setIsLoading(false);
					return;
				}

				// Upload the image to Sanity
				const imageUploadResponse = await client.assets.upload(
					"image",
					mainImage
				);
				mainImageRef = imageUploadResponse._id; 
			} catch (error) {
				console.error("Error uploading image to Sanity:", error);
				alert("Failed to upload image. Please try again.");
				setIsLoading(false);
				return;
			}
		}

		// Convert content to Sanity block format with unique keys
		const blocks = [{
			_type: "block",
			_key: uuidv4(), // Generate a unique key for this block
			style: "normal",
			markDefs: [],
			children: [{
				_key: uuidv4(), // Generate a unique key for the child
				_type: "span",
				marks: [],
				text: content,
			}]
		}];

		// Create new post in Sanity
		const newPost = {
			_type: "post",
			title: title,
			body: blocks, // Use the converted content with unique keys
			author: {
				_type: "reference",
				_ref: user.id,
			},
			mainImage: {
				asset: {
					_ref: mainImageRef,
					_type: "reference",
				},
			},
			publishedAt: new Date().toISOString(),
			categories: [],
		};

		try {
			await client.create(newPost);
			alert("Post created successfully!");
			setTitle("");
			setContent("");
			setMainImage(null);
		} catch (error) {
			console.error("Failed to create post in Sanity:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
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
						<div>
							<Label htmlFor="title" className="dark:text-white">
								Title
							</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Enter post title"
								className="dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<Label htmlFor="content" className="dark:text-white">
								Content
							</Label>
							<QuillEditor initialValue={content} onChange={setContent} />
						</div>
						<div>
							<Label htmlFor="mainImage" className="dark:text-white">
								Main Image
							</Label>
							<Input
								type="file"
								accept="image/*"
								onChange={(e) =>
									e.target.files && setMainImage(e.target.files[0])
								}
								className="dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						onClick={handleSubmit}
						disabled={isLoading}
						className={`dark:bg-gray-700 dark:text-white ${
							isLoading ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{isLoading ? "Submitting..." : "Submit"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default CreatePost;
