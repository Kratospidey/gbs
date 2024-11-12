// src/app/api/deleteAccount/route.ts
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
		// Step 2: Fetch the author document using clerk_id
		const authorDoc = await sanityClient.fetch(
			`*[_type == "author" && clerk_id == $userId][0]{ _id }`,
			{ userId }
		);

		if (!authorDoc) {
			// If no author document is found, proceed to delete savedPosts and user
			console.warn(`No author document found for userId: ${userId}`);
		}

		// Step 3: Fetch savedPost documents to delete
		const savedPostsToDelete = await sanityClient.fetch(
			`*[_type == "savedPost" && user == $userId]{_id}`,
			{ userId }
		);

		// Step 4: Initialize a Sanity transaction
		let transaction = sanityClient.transaction();

		// Step 5: Delete savedPost documents
		savedPostsToDelete.forEach((savedPost: { _id: string }) => {
			transaction = transaction.delete(savedPost._id);
		});

		// Step 6: If author document exists, proceed to delete their posts and the author document
		if (authorDoc && authorDoc._id) {
			// Fetch all posts authored by this author
			const postsToDelete = await sanityClient.fetch(
				`*[_type == "post" && author._ref == $authorId]{_id}`,
				{ authorId: authorDoc._id }
			);

			// Delete each post
			postsToDelete.forEach((post: { _id: string }) => {
				transaction = transaction.delete(post._id);
			});

			// Delete the author document
			transaction = transaction.delete(authorDoc._id);
		}

		// Step 7: Commit the transaction
		await transaction.commit();

		// Step 8: Delete the user from Clerk
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
