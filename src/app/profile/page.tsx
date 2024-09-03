"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DarkModeToggle from "@/components/DarkModeToggle";


import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const ProfilePage: React.FC = () => {
	const { user } = useUser();
	const [profile, setProfile] = useState<any>({
		firstName: "",
		lastName: "",
		bio: "",
		profilePicture: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
	const [isChanged, setIsChanged] = useState(false);

	const [originalProfile, setOriginalProfile] = useState<any>({
		firstName: "",
		lastName: "",
		bio: "",
		profilePicture: "",
	});

	useEffect(() => {
		const fetchUserProfile = async () => {
			if (user?.id) {
				const { data, error } = await supabase
					.from("user_profiles")
					.select("*")
					.eq("user_id", user.id)
					.single();

				if (data) {
					const initialProfile = {
						firstName: data.first_name || "",
						lastName: data.last_name || "",
						bio: data.bio || "",
						profilePicture: data.profile_picture || "",
					};
					setProfile(initialProfile);
					setOriginalProfile(initialProfile);
				} else if (error) {
					console.error("Error fetching profile: ", error);
				}
			}
		};

		fetchUserProfile();
	}, [user]);

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

		const { error } = await supabase.from("user_profiles").upsert({
			user_id: user?.id,
			first_name: profile.firstName,
			last_name: profile.lastName,
			bio: profile.bio,
			profile_picture: profilePictureUrl,
		});

		if (error) {
			console.error("Error updating profile: ", error);
		} else {
			alert("Profile updated successfully!");
			setOriginalProfile(profile);
			setIsChanged(false);
		}

		setIsLoading(false);
	};

	const handleInputChange = (field: string, value: string) => {
		setProfile((prev: any) => {
			const updatedProfile = { ...prev, [field]: value };
			setIsChanged(
				updatedProfile.firstName !== originalProfile.firstName ||
					updatedProfile.lastName !== originalProfile.lastName ||
					updatedProfile.bio !== originalProfile.bio ||
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
						<img
							src={
								profile.profilePicture ||
								"https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"
							}
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
