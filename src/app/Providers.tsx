// src/app/Providers.tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { syncUserProfile } from "@/lib/syncUserProfile";

interface ProvidersProps {
	children: React.ReactNode;
}

function UserProfileSync() {
	const { user, isSignedIn } = useUser();

	useEffect(() => {
		const ensureUserProfile = async () => {
			if (isSignedIn && user) {
				const profileData = {
					user_id: user.id,
					first_name: user.firstName || "",
					last_name: user.lastName || "",
					bio:
						typeof user.publicMetadata?.bio === "string"
							? user.publicMetadata.bio
							: "",
					profile_picture: user.imageUrl || "",
					github:
						user.externalAccounts?.find(
							(account) => account.provider === "github"
						)?.username || "",
					linkedin:
						user.externalAccounts?.find(
							(account) => account.provider === "linkedin"
						)?.username || "",
					custom_link:
						typeof user.publicMetadata?.custom_link === "string"
							? user.publicMetadata.custom_link
							: "",
				};

				const result = await syncUserProfile(profileData);
				if (!result) {
					console.error("Failed to sync user profile with Supabase.");
				}
			}
		};

		ensureUserProfile();
	}, [isSignedIn, user]);

	return null;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<ClerkProvider>
			<UserProfileSync />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				enableSystem
				disableTransitionOnChange
			>
				{children}
			</ThemeProvider>
		</ClerkProvider>
	);
}
