"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import { toast } from "react-hot-toast";

const AuthSyncProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { user, isLoaded } = useUser();

	useEffect(() => {
		const syncUserWithSanity = async () => {
			if (!user?.id) return;

			try {
				// Check if user exists in Sanity
				const query = `*[_type == "author" && clerk_id == $clerkId][0]`;
				const params = { clerkId: user.id };
				const fetchedUser = await client.fetch(query, params);

				if (!fetchedUser) {
					// Create new author using Clerk's data
					await client.createIfNotExists({
						_id: `clerkId-${user.id}`, // Unique _id
						_type: "author",
						name: user.username || "",
						firstName: user.firstName || "First",
						lastName: user.lastName || "Last",
						clerk_id: user.id,
						email: user.primaryEmailAddress?.emailAddress || "",
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
				}
			} catch (error) {
				console.error("Sanity sync error:", error);
				toast.error("Error syncing with Sanity.");
			}
		};

		if (isLoaded) {
			syncUserWithSanity();
		}
	}, [user, isLoaded]);

	return <>{children}</>;
};

export default AuthSyncProvider;
