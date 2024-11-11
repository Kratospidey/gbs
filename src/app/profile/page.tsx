// app/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { syncUserProfile } from "@/lib/syncUserProfile";
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
	firstName: string;
	lastName: string;
	bio: string;
	profilePicture: string | null;
	githubUrl: string;
	linkedinUrl: string;
	customUrl: string;
}

const urlSchema = z.string().url().nullable().optional();

const ProfilePage: React.FC = () => {
	const { user, isLoaded } = useUser();
	const router = useRouter();

	// State declarations
	const [profile, setProfile] = useState<Profile>({
		firstName: "",
		lastName: "",
		bio: "",
		profilePicture: null,
		githubUrl: "",
		linkedinUrl: "",
		customUrl: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [isChanged, setIsChanged] = useState(false);
	const [originalProfile, setOriginalProfile] = useState<Profile | null>(null);

	// Load profile data
	useEffect(() => {
		const loadProfile = async () => {
			if (!user?.id) return;

			try {
				const { data, error } = await supabase
					.from("user_profiles") // Changed from profiles to user_profiles
					.select(
						`
          first_name,
          last_name, 
          bio,
          profile_picture,
          github,
          linkedin,
          custom_link
        `
					)
					.eq("user_id", user.id)
					.single();

				if (error) throw error;

				if (data) {
					// Map DB columns to Profile interface
					setProfile({
						firstName: data.first_name || "",
						lastName: data.last_name || "",
						bio: data.bio || "",
						profilePicture: data.profile_picture || null,
						githubUrl: data.github || "",
						linkedinUrl: data.linkedin || "",
						customUrl: data.custom_link || "",
					});
					setOriginalProfile({
						firstName: data.first_name || "",
						lastName: data.last_name || "",
						bio: data.bio || "",
						profilePicture: data.profile_picture || null,
						githubUrl: data.github || "",
						linkedinUrl: data.linkedin || "",
						customUrl: data.custom_link || "",
					});
				}
			} catch (error) {
				toast.error("Error loading profile");
				console.error(error);
			}
		};

		loadProfile();
	}, [user?.id]);

	// Handle profile picture change
	const handleProfilePicChange = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		if (!e.target.files?.[0]) return;

		const file = e.target.files[0];
		setIsLoading(true);

		try {
			const { data, error } = await supabase.storage
				.from("profile-pictures")
				.upload(`${user?.id}/${file.name}`, file);

			if (error) throw error;

			const url = supabase.storage
				.from("profile-pictures")
				.getPublicUrl(data.path).data.publicUrl;

			handleInputChange("profilePicture", url);
		} catch (error) {
			toast.error("Error uploading image");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle input changes
	const handleInputChange = (field: keyof Profile, value: string) => {
		setProfile((prev) => ({
			...prev,
			[field]: value,
		}));
		setIsChanged(true);
	};

	// Handle profile update
	const handleUpdateProfile = async () => {
		if (!user?.id) return;

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
				return;
			}

			const { error } = await supabase.from("user_profiles").upsert({
				user_id: user.id,
				first_name: profile.firstName,
				last_name: profile.lastName,
				bio: profile.bio,
				profile_picture: profile.profilePicture,
				github: profile.githubUrl,
				linkedin: profile.linkedinUrl,
				custom_link: profile.customUrl,
				updated_at: new Date().toISOString(),
			});

			if (error) throw error;

			await syncUserProfile({
				user_id: user.id,
				first_name: profile.firstName,
				last_name: profile.lastName,
				bio: profile.bio,
				profile_picture: profile.profilePicture || undefined, // Fix null type
				github: profile.githubUrl,
				linkedin: profile.linkedinUrl,
				custom_link: profile.customUrl,
			});
			toast.success("Profile updated successfully");
			setOriginalProfile(profile);
			setIsChanged(false);
		} catch (error) {
			toast.error("Error updating profile");
			console.error(error);
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

	if (!isLoaded || !user) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container max-w-4xl mx-auto px-4 sm:px-6 py-6">
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
							src={profile.profilePicture || "/default-avatar.png"}
							width={100}
							height={100}
							alt="Profile Picture"
							className="rounded-full object-cover"
						/>
						<Input
							type="file"
							accept="image/*"
							onChange={handleProfilePicChange}
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
								value={user?.username || ""}
								disabled
								className="h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email Address</Label>
							<Input
								id="email"
								value={user?.emailAddresses[0]?.emailAddress || ""}
								disabled
								className="h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input
								id="firstName"
								value={profile.firstName}
								onChange={(e) => handleInputChange("firstName", e.target.value)}
								className="h-10 border-zinc-200 dark:border-zinc-800"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
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
							value={profile.bio}
							onChange={(e) => handleInputChange("bio", e.target.value)}
							className="min-h-[100px] border-zinc-200 dark:border-zinc-800"
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
