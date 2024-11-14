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
		// Step 2: Fetch the author document using the Clerk ID
		const authorDoc = await sanityClient.fetch(
			`*[_type == "author" && clerk_id == $userId][0]{ _id }`,
			{ userId }
		);

		if (!authorDoc || !authorDoc._id) {
			console.warn(`No author document found for userId: ${userId}`);
		}

		// Step 3: Initialize a Sanity transaction to delete associated documents
		let transaction = sanityClient.transaction();

		// Step 4: Fetch and delete savedPost documents associated with the author
		const savedPostsToDelete = await sanityClient.fetch(
			`*[_type == "savedPost" && user._ref == $authorId]{ _id }`,
			{ authorId: authorDoc._id }
		);

		savedPostsToDelete.forEach((savedPost: { _id: string }) => {
			transaction = transaction.delete(savedPost._id);
		});

		// Step 5: Fetch and delete all posts authored by the author
		const postsToDelete = await sanityClient.fetch(
			`*[_type == "post" && author._ref == $authorId]{ _id }`,
			{ authorId: authorDoc._id }
		);

		postsToDelete.forEach((post: { _id: string }) => {
			transaction = transaction.delete(post._id);
		});

		// Step 6: Delete the author document if it exists
		if (authorDoc._id) {
			transaction = transaction.delete(authorDoc._id);
		}

		// Step 7: Commit the transaction to delete all associated data in Sanity
		await transaction.commit();
		console.log("All associated documents deleted from Sanity.");

		// Step 8: Delete the user from Clerk
		await clerkClient.users.deleteUser(userId);

		return NextResponse.json(
			{ message: "Account and associated data deleted successfully" },
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Delete account error:", error);
		return NextResponse.json({ message: error.message }, { status: 500 });
	}
}
