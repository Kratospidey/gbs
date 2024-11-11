// src/app/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import { urlFor } from "@/lib/urlFor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// Types and validation schemas
interface Profile {
	username: string;
	firstName: string;
	lastName: string;
	bio: string; // Changed to string for simpler handling
	profilePicture: string | null;
	githubUrl: string;
	linkedinUrl: string;
	customUrl: string;
	email: string; // Added email
}

const urlSchema = z.preprocess((arg) => {
	if (typeof arg === "string" && arg.trim() === "") {
		return undefined;
	}
	return arg;
}, z.string().url().optional());

const ProfilePage: React.FC = () => {
	const { user, isLoaded } = useUser();
	const router = useRouter();

	// State declarations
	const [profile, setProfile] = useState<Profile>({
		username: "",
		firstName: "",
		lastName: "",
		bio: "",
		profilePicture: null,
		githubUrl: "",
		linkedinUrl: "",
		customUrl: "",
		email: "", // Initialize email
	});
	const [existingUser, setExistingUser] = useState<any>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isChanged, setIsChanged] = useState(false);

	// Sync user with Sanity
	useEffect(() => {
		const syncUserWithSanity = async () => {
			if (!user?.id) return;

			try {
				// Check if user exists in Sanity
				const query = `*[_type == "author" && clerk_id == $clerkId][0]`;
				const params = { clerkId: user.id };
				const fetchedUser = await client.fetch(query, params);

				if (fetchedUser) {
					setExistingUser(fetchedUser);
				} else {
					// Create new author using Clerk's username and email
					const newUser = await client.create({
						_type: "author",
						name: user.username || "", // Clerk's username
						firstName: user.firstName || "First",
						lastName: user.lastName || "Last",
						clerk_id: user.id,
						email: user.primaryEmailAddress?.emailAddress || "", // Store email if desired
						bio: [
							{
								_type: "block",
								_key: `block-${Date.now()}`,
								style: "normal",
								children: [
									{
										_type: "span",
										_key: `span-${Date.now()}`,
										text: "",
										marks: [],
									},
								],
							},
						],
						github: "",
						linkedin: "",
						website: "",
					});
					setExistingUser(newUser);
					toast.success("Account initialized in Sanity.");
				}
			} catch (error) {
				toast.error("Error syncing user with Sanity.");
				console.error("Sanity sync error:", error);
			}
		};

		syncUserWithSanity();
	}, [user?.id, user?.username, user?.primaryEmailAddress?.emailAddress]); // Added user's email as dependency

	// Load profile data from Sanity
	useEffect(() => {
		const loadProfile = async () => {
			if (!user?.id) return;

			try {
				const query = `*[_type == "author" && clerk_id == $clerkId][0]{
          name,
          firstName,
          lastName,
          bio,
          image,
          github,
          linkedin,
          website,
          email // Fetch email if stored in Sanity
        }`;
				const params = { clerkId: user.id };
				const data = await client.fetch(query, params);

				if (data) {
					setProfile({
						username: data.name || "",
						firstName: data.firstName || "",
						lastName: data.lastName || "",
						bio:
							Array.isArray(data.bio) && data.bio[0]?.children?.length > 0
								? data.bio
										.map((block: any) =>
											block.children.map((child: any) => child.text).join("")
										)
										.join("\n")
								: "",
						profilePicture: data.image ? urlFor(data.image).url() : null,
						githubUrl: data.github || "",
						linkedinUrl: data.linkedin || "",
						customUrl: data.website || "",
						email: data.email || user.primaryEmailAddress?.emailAddress || "", // Set email from Sanity or Clerk
					});
				} else {
					// If email is not stored in Sanity, set it from Clerk
					setProfile((prev) => ({
						...prev,
						email: data.email || user.primaryEmailAddress?.emailAddress || "", 
					}));
				}
			} catch (error) {
				toast.error("Error loading profile from Sanity.");
				console.error(error);
			}
		};

		loadProfile();
	}, [user?.id, user?.primaryEmailAddress?.emailAddress]);

	// Handle file selection
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			const file = e.target.files[0];
			setSelectedFile(file);
			setIsChanged(true);

			// Generate a preview URL
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		}
	};

	// Handle input changes
	const handleInputChange = (field: keyof Profile, value: string | any[]) => {
		setProfile((prev) => ({
			...prev,
			[field]: value,
		}));
		setIsChanged(true);
	};

	// Handle profile update
	const handleUpdateProfile = async () => {
		if (!user?.id || !existingUser) {
			toast.error("User not authenticated.");
			return;
		}

		setIsLoading(true);

		try {
			// Validate URLs
			const urlValidation = {
				githubUrl: urlSchema.safeParse(profile.githubUrl),
				linkedinUrl: urlSchema.safeParse(profile.linkedinUrl),
				customUrl: urlSchema.safeParse(profile.customUrl),
			};

			const hasUrlErrors = Object.values(urlValidation).some(
				(result) => !result.success
			);

			if (hasUrlErrors) {
				toast.error("Please enter valid URLs");
				setIsLoading(false);
				return;
			}

			let imageAssetId = existingUser.image?.asset?._ref || null;

			// If a file is selected, upload it to Sanity
			if (selectedFile) {
				try {
					const asset = await client.assets.upload("image", selectedFile);
					imageAssetId = asset._id;
				} catch (uploadError) {
					throw new Error("Failed to upload image");
				}
			}

			// Sanitize profile data
			const sanitizedProfile: any = {
				firstName: profile.firstName || "First",
				lastName: profile.lastName || "Last",
				bio: [
					{
						_type: "block",
						_key: `block-${Date.now()}`,
						style: "normal",
						children: [
							{
								_type: "span",
								_key: `span-${Date.now()}`,
								text: profile.bio || "",
								marks: [],
							},
						],
					},
				],
				// Only include image if we have an asset
				...(imageAssetId && {
					image: {
						_type: "image",
						asset: { _type: "reference", _ref: imageAssetId },
					},
				}),
				github: profile.githubUrl || "",
				linkedin: profile.linkedinUrl || "",
				website: profile.customUrl || "",
				// Email is non-editable, ensure it's not modified
			};

			// Update profile in Sanity
			await client.patch(existingUser._id).set(sanitizedProfile).commit();

			toast.success("Profile updated successfully!");
			setIsChanged(false);
			setSelectedFile(null);
			setPreviewUrl(null);
		} catch (error: any) {
			toast.error(error.message || "Error updating profile");
			console.error("Error updating profile:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Auth check
	useEffect(() => {
		if (isLoaded && !user) {
			router.push("/signin");
		}
	}, [isLoaded, user, router]);

	// Cleanup preview URL on unmount or when a new file is selected
	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	if (!isLoaded || !user) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container max-w-4xl mx-auto px-4 sm:px-6 py-6">
			{/* Place the Toaster component at the root of your app */}
			<div className="flex flex-col space-y-2 mb-8">
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Profile Settings
				</h1>
				<p className="text-sm text-muted-foreground">
					Manage your personal information and preferences
				</p>
			</div>
			<Separator className="my-4 sm:my-6" />

			<Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
				<CardHeader>
					<CardTitle className="text-lg sm:text-xl font-semibold">
						Personal Information
					</CardTitle>
					<CardDescription>
						Update your profile details and social links
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Profile Picture */}
					<div className="flex flex-col items-center gap-4">
						<Image
							src={
								previewUrl || profile.profilePicture || "/default-avatar.png"
							}
							width={100}
							height={100}
							alt="Profile Picture"
							className="rounded-full object-cover"
							onError={(e) => {
								(e.currentTarget as HTMLImageElement).src =
									"/default-avatar.png";
							}}
						/>
						<Input
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
							className="w-full max-w-xs h-10 border-zinc-200 dark:border-zinc-800"
						/>
					</div>

					<Separator className="my-4 sm:my-6" />

					{/* Basic Info */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								name="username"
								value={profile.username}
								readOnly
								className="h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed opacity-70"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								value={profile.email}
								readOnly
								className="h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed opacity-70"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input
								id="firstName"
								name="firstName"
								value={profile.firstName}
								onChange={(e) => handleInputChange("firstName", e.target.value)}
								className="h-10 border-zinc-200 dark:border-zinc-800"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
								name="lastName"
								value={profile.lastName}
								onChange={(e) => handleInputChange("lastName", e.target.value)}
								className="h-10 border-zinc-200 dark:border-zinc-800"
							/>
						</div>
					</div>

					<Separator className="my-4 sm:my-6" />

					{/* Social Links */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="githubUrl">GitHub URL</Label>
							<Input
								id="githubUrl"
								name="githubUrl"
								type="url"
								value={profile.githubUrl}
								onChange={(e) => handleInputChange("githubUrl", e.target.value)}
								className="h-10 border-zinc-200 dark:border-zinc-800"
								placeholder="https://github.com/username"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="linkedinUrl">LinkedIn URL</Label>
							<Input
								id="linkedinUrl"
								name="linkedinUrl"
								type="url"
								value={profile.linkedinUrl}
								onChange={(e) =>
									handleInputChange("linkedinUrl", e.target.value)
								}
								className="h-10 border-zinc-200 dark:border-zinc-800"
								placeholder="https://linkedin.com/in/username"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="customUrl">Personal Website</Label>
							<Input
								id="customUrl"
								name="customUrl"
								type="url"
								value={profile.customUrl}
								onChange={(e) => handleInputChange("customUrl", e.target.value)}
								className="h-10 border-zinc-200 dark:border-zinc-800"
								placeholder="https://your-website.com"
							/>
						</div>
					</div>

					<Separator className="my-4 sm:my-6" />

					{/* Bio */}
					<div className="space-y-2">
						<Label htmlFor="bio">Bio</Label>
						<Textarea
							id="bio"
							name="bio"
							value={profile.bio}
							onChange={(e) => handleInputChange("bio", e.target.value)}
							className="min-h-[100px] resize-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
							placeholder="Tell us about yourself..."
						/>
					</div>
				</CardContent>

				<CardFooter className="flex justify-end space-x-4 pt-6">
					<Button
						onClick={handleUpdateProfile}
						disabled={!isChanged || isLoading}
						className="h-9 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900"
					>
						{isLoading ? (
							<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Icons.save className="mr-2 h-4 w-4" />
						)}
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default ProfilePage;
