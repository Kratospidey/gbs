// app/profile/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DarkModeToggle from "@/components/DarkModeToggle";
import { toast } from "react-toastify";
import { syncUserProfile } from "@/lib/syncUserProfile";
import { z } from "zod"; // For validation
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// URL validation schema
const urlSchema = z.string().url().or(z.literal(""));

// Add type definition at the top of the file
interface UserProfileData {
	user_id: string;
	first_name: string;
	last_name: string;
	bio: string;
	profile_picture?: string;
	github?: string;
	linkedin?: string;
	custom_link?: string;
}

const ProfilePage: React.FC = () => {
	const { user, isLoaded } = useUser();
	const router = useRouter();

	// Move all useState declarations here, before any conditionals
	const [profile, setProfile] = useState<any>({
		firstName: "",
		lastName: "",
		bio: "",
		profilePicture: "",
		githubUrl: "",
		linkedinUrl: "",
		customUrl: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
	const [isChanged, setIsChanged] = useState(false);
	const [originalProfile, setOriginalProfile] = useState<any>({
		firstName: "",
		lastName: "",
		bio: "",
		profilePicture: "",
		githubUrl: "",
		linkedinUrl: "",
		customUrl: "",
	});

	// Auth check effect
	useEffect(() => {
		if (isLoaded && !user) {
			router.push("/signin");
		}
	}, [isLoaded, user, router]);

	// Profile fetch effect
	useEffect(() => {
		const fetchUserProfile = async () => {
			if (user?.id) {
				let { data, error } = await supabase
					.from("user_profiles")
					.select("*")
					.eq("user_id", user.id)
					.single();

				if (error) {
					// Initialize profile if it doesn't exist
					await syncUserProfile({
						user_id: user.id,
						first_name: user.firstName || "",
						last_name: user.lastName || "",
						bio: "",
						profile_picture: "/default-avatar.png",
						github: "",
						linkedin: "",
						custom_link: "",
					});

					// Fetch again after initialization
					const { data: newData } = await supabase
						.from("user_profiles")
						.select("*")
						.eq("user_id", user.id)
						.single();

					if (newData) data = newData;
				}

				if (data) {
					const initialProfile = {
						firstName: data.first_name || "",
						lastName: data.last_name || "",
						bio: data.bio || "",
						profilePicture: data.profile_picture || "/default-avatar.png",
						githubUrl: data.github || "",
						linkedinUrl: data.linkedin || "",
						customUrl: data.custom_link || "",
					};
					setProfile(initialProfile);
					setOriginalProfile(initialProfile);
				}
			}
		};

		fetchUserProfile();
	}, [user]);

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

	const handleUpdateProfile = async () => {
		setIsLoading(true);
		let profilePictureUrl = profile.profilePicture;

		if (newProfilePic) {
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("user_pfp")
				.upload(`public/${user?.id}/${newProfilePic.name}`, newProfilePic, {
					cacheControl: "3600",
					upsert: true,
				});

			if (uploadError) {
				console.error("Error uploading profile picture: ", uploadError);
			} else {
				const { data: publicUrlData } = supabase.storage
					.from("user_pfp")
					.getPublicUrl(`public/${user?.id}/${newProfilePic.name}`);

				profilePictureUrl = publicUrlData?.publicUrl || profile.profilePicture;
			}
		}

		if (!user?.id) return;

		const profileData: UserProfileData = {
			user_id: user.id,
			first_name: profile.firstName,
			last_name: profile.lastName,
			bio: profile.bio,
			profile_picture: profilePictureUrl,
			github: profile.githubUrl,
			linkedin: profile.linkedinUrl,
			custom_link: profile.customUrl,
		};

		console.log("Sending profile data:", profileData);

		const result = await syncUserProfile(profileData);

		if (result) {
			toast.success("Profile updated successfully!");
			setOriginalProfile(profile);
		} else {
			toast.error("Failed to update profile");
		}

		setIsLoading(false);
		setIsChanged(false);
	};

	const handleInputChange = (field: string, value: string) => {
		if (field.includes("Url")) {
			try {
				urlSchema.parse(value);
			} catch (error) {
				toast.error("Please enter a valid URL");
				return;
			}
		}

		setProfile((prev: any) => {
			const updatedProfile = { ...prev, [field]: value };
			setIsChanged(
				updatedProfile.firstName !== originalProfile.firstName ||
					updatedProfile.lastName !== originalProfile.lastName ||
					updatedProfile.bio !== originalProfile.bio ||
					updatedProfile.githubUrl !== originalProfile.githubUrl ||
					updatedProfile.linkedinUrl !== originalProfile.linkedinUrl ||
					updatedProfile.customUrl !== originalProfile.customUrl ||
					(newProfilePic
						? true
						: updatedProfile.profilePicture !== originalProfile.profilePicture)
			);
			return updatedProfile;
		});
	};

	const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setNewProfilePic(file);
			setIsChanged(true);
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
			<DarkModeToggle />
			<Card className="dark:bg-gray-800 dark:border-gray-700">
				<CardHeader>
					<CardTitle className="dark:text-white">Edit Profile</CardTitle>
					<CardDescription className="dark:text-gray-300">
						Update your profile information
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center gap-3">
						<Image
							src={
								profile.profilePicture ||
								"https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"
							}
							width={250}
							height={250}
							alt="Profile Picture"
							className="w-24 h-24 rounded-full mb-4"
						/>
						<Input
							type="file"
							accept="image/*"
							onChange={handleProfilePicChange}
							className="dark:bg-gray-700 dark:text-white"
						/>
					</div>
					<div className="mb-4">
						<Label htmlFor="username" className="dark:text-white">
							Username
						</Label>
						<Input
							id="username"
							value={user?.username || ""}
							disabled
							className="dark:bg-gray-700 dark:text-white"
						/>
					</div>

					<div className="mb-4">
						<Label htmlFor="email" className="dark:text-white">
							Email Address
						</Label>
						<Input
							id="email"
							value={user?.emailAddresses[0]?.emailAddress || ""}
							disabled
							className="dark:bg-gray-700 dark:text-white"
						/>
					</div>

					<div className="mb-4">
						<Label htmlFor="firstName" className="dark:text-white">
							First Name
						</Label>
						<Input
							id="firstName"
							value={profile.firstName}
							onChange={(e) => handleInputChange("firstName", e.target.value)}
							className="dark:bg-gray-700 dark:text-white"
						/>
					</div>

					<div className="mb-4">
						<Label htmlFor="lastName" className="dark:text-white">
							Last Name
						</Label>
						<Input
							id="lastName"
							value={profile.lastName}
							onChange={(e) => handleInputChange("lastName", e.target.value)}
							className="dark:bg-gray-700 dark:text-white"
						/>
					</div>

					<div className="mb-4">
						<Label htmlFor="githubUrl" className="dark:text-white">
							GitHub URL
						</Label>
						<Input
							id="githubUrl"
							value={profile.githubUrl}
							onChange={(e) => handleInputChange("githubUrl", e.target.value)}
							className="dark:bg-gray-700 dark:text-white"
							placeholder="https://github.com/username"
						/>
					</div>

					<div className="mb-4">
						<Label htmlFor="linkedinUrl" className="dark:text-white">
							LinkedIn URL
						</Label>
						<Input
							id="linkedinUrl"
							value={profile.linkedinUrl}
							onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
							className="dark:bg-gray-700 dark:text-white"
							placeholder="https://linkedin.com/in/username"
						/>
					</div>

					<div className="mb-4">
						<Label htmlFor="customUrl" className="dark:text-white">
							Custom URL
						</Label>
						<Input
							id="customUrl"
							value={profile.customUrl}
							onChange={(e) => handleInputChange("customUrl", e.target.value)}
							className="dark:bg-gray-700 dark:text-white"
							placeholder="https://your-website.com"
						/>
					</div>

					<div className="mb-4">
						<Label htmlFor="bio" className="dark:text-white">
							Bio
						</Label>
						<Textarea
							id="bio"
							value={profile.bio}
							onChange={(e) => handleInputChange("bio", e.target.value)}
							className="dark:bg-gray-700 dark:text-white"
						/>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						onClick={handleUpdateProfile}
						variant="default"
						disabled={!isChanged || isLoading}
						className={`dark:bg-gray-700 dark:text-white ${
							!isChanged ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default ProfilePage;
