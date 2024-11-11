// src/lib/syncUserProfile.ts

import { supabase } from "./supabaseClient";

interface UserProfileData {
	user_id: string;
	first_name?: string;
	last_name?: string;
	bio?: string;
	profile_picture?: string;
	github?: string;
	linkedin?: string;
	custom_link?: string;
}

export async function syncUserProfile(data: UserProfileData): Promise<boolean> {
	try {
		// Fetch existing profile to check if profile_picture is empty
		const { data: existingProfile, error: fetchError } = await supabase
			.from("user_profiles")
			.select("profile_picture")
			.eq("user_id", data.user_id)
			.single();

		if (fetchError) {
			console.error("Error fetching existing profile:", fetchError);
			return false;
		}

		// Prepare upsert data
		const upsertData = { ...data };

		// If existing profile_picture is not empty, exclude profile_picture from upsert
		if (existingProfile?.profile_picture) {
			delete upsertData.profile_picture;
		}

		// Remove undefined properties
		const finalUpsertData = Object.fromEntries(
			Object.entries(upsertData).filter(([_, v]) => v !== undefined)
		);

		const { error } = await supabase
			.from("user_profiles")
			.upsert(finalUpsertData, { onConflict: "user_id" });

		if (error) {
			console.error("Error updating profile:", error);
			return false;
		}
		return true;
	} catch (error) {
		console.error("Error in syncUserProfile:", error);
		return false;
	}
}
