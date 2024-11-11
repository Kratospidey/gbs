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
		const { error } = await supabase.from("user_profiles").upsert(
			{
				user_id: data.user_id,
				first_name: data.first_name,
				last_name: data.last_name,
				bio: data.bio,
				profile_picture: data.profile_picture,
				github: data.github,
				linkedin: data.linkedin,
				custom_link: data.custom_link,
			},
			{ onConflict: "user_id" }
		);

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
