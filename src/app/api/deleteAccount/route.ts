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
		// Get Clerk user
		const user = await clerkClient.users.getUser(userId);
		const username = user.username;

		if (!username) {
			return NextResponse.json(
				{ message: "Username not found" },
				{ status: 400 }
			);
		}

		// Delete user profile from Supabase
		const { error: supabaseError } = await supabase
			.from("user_profiles")
			.delete()
			.eq("user_id", userId);

		if (supabaseError) {
			throw new Error(supabaseError.message);
		}

		// Fetch the author document from Sanity
		const authorQuery = `*[_type == "author" && name == $username][0]`;
		const author = await sanityClient.fetch(authorQuery, { username });

		if (author) {
			// Fetch all posts by the author
			const postsToDelete = await sanityClient.fetch(
				`*[_type == "post" && author._ref == $authorId]{_id}`,
				{ authorId: author._id }
			);

			console.log("Posts to delete:", postsToDelete);

			// Collect all post IDs to be deleted
			const postIds = postsToDelete.map((post: { _id: string }) => post._id);

			// Fetch savedPost documents that reference these posts
			const savedPostsToUpdate = await sanityClient.fetch(
				`*[_type == "savedPost" && posts[].post._ref in $postIds]{_id, posts}`,
				{ postIds }
			);

			console.log("SavedPosts to update:", savedPostsToUpdate);

			// Build a transaction to update savedPost documents, delete posts and author
			let transaction = sanityClient.transaction();

			// Update savedPost documents to remove references to the posts being deleted
			savedPostsToUpdate.forEach((savedPost: { _id: string; posts: any[] }) => {
				// Filter out the posts that are being deleted
				const updatedPosts = savedPost.posts.filter(
					(postObj: any) => !postIds.includes(postObj.post._ref)
				);

				if (updatedPosts.length === 0) {
					// If no posts are left, delete the savedPost document
					transaction = transaction.delete(savedPost._id);
				} else {
					// Otherwise, update the posts field
					transaction = transaction.patch(savedPost._id, {
						set: { posts: updatedPosts },
					});
				}
			});

			// Add post deletions to the transaction
			postsToDelete.forEach((post: { _id: string }) => {
				transaction = transaction.delete(post._id);
			});

			// Delete the author document
			transaction = transaction.delete(author._id);

			// Commit the transaction
			await transaction.commit();
		}

		// Delete Clerk user
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
