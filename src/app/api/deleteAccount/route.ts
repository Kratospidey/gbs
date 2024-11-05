import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";
import sanityClient from "@/lib/sanityClient";
import { createClerkClient } from "@clerk/clerk-sdk-node";

// Initialize the Clerk client
const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});

export async function DELETE(request: NextRequest) {
	// Authenticate the user
	const { userId } = getAuth(request);

	if (!userId) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	try {
		// Delete Clerk user
		await clerkClient.users.deleteUser(userId);

		// Fetch the author document from Sanity
		const author = await sanityClient.fetch(
			`*[_type == "author" && _id == $userId][0]`,
			{ userId }
		);

		if (author) {
			const authorId = author._id;

			// Begin Sanity transaction
			let transaction = sanityClient.transaction();

			// Delete savedPost documents where user matches authorId
			const savedPostsToDelete = await sanityClient.fetch(
				`*[_type == "savedPost" && user == $authorId]{_id}`,
				{ authorId }
			);
			savedPostsToDelete.forEach((savedPost: { _id: string }) => {
				transaction = transaction.delete(savedPost._id);
			});

			// Delete posts authored by the user
			const postsToDelete = await sanityClient.fetch(
				`*[_type == "post" && author._ref == $authorId]{_id}`,
				{ authorId }
			);
			postsToDelete.forEach((post: { _id: string }) => {
				transaction = transaction.delete(post._id);
			});

			// Delete the author document
			transaction = transaction.delete(authorId);

			// Commit the transaction
			await transaction.commit();
		}

		// Delete user profile from Supabase
		const { error: supabaseError } = await supabase
			.from("user_profiles")
			.delete()
			.eq("user_id", userId);

		if (supabaseError) {
			throw new Error(supabaseError.message);
		}

		return NextResponse.json(
			{ message: "Account deleted successfully" },
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Delete account error:", error);
		return NextResponse.json({ message: error.message }, { status: 500 });
	}
}
