// src/app/api/[tagname]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import sanityClient from "@/lib/sanityClient";
import { createClerkClient } from "@clerk/clerk-sdk-node";

// Initialize the Clerk client
const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});

export async function DELETE(request: NextRequest) {
	// Step 1: Get current user ID from Clerk
	const { userId } = getAuth(request);

	if (!userId) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	try {
		// Step 2: Delete all savedPost documents corresponding to that user ID in Sanity
		const savedPostsToDelete = await sanityClient.fetch(
			`*[_type == "savedPost" && user == $userId]{_id}`,
			{ userId }
		);

		let transaction = sanityClient.transaction();

		savedPostsToDelete.forEach((savedPost: { _id: string }) => {
			transaction = transaction.delete(savedPost._id);
		});

		// Step 3: Delete all posts authored by the user in Sanity
		const postsToDelete = await sanityClient.fetch(
			`*[_type == "post" && author._ref == $userId]{_id}`,
			{ userId }
		);

		postsToDelete.forEach((post: { _id: string }) => {
			transaction = transaction.delete(post._id);
		});

		// Step 4: Delete the author document with the same user ID in Sanity
		transaction = transaction.delete(userId);

		// Commit the transaction in Sanity
		await transaction.commit();

		// Step 5: Delete the user itself from Clerk using the clerk_id from the author document
		await clerkClient.users.deleteUser(userId);

		return NextResponse.json(
			{ message: "Account deleted successfully" },
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Delete account error:", error);
		return NextResponse.json({ message: error.message }, { status: 500 });
	}
}
