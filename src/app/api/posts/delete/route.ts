import { NextResponse, NextRequest } from "next/server";
import client from "@/lib/sanityClient";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
	try {
		const { userId } = getAuth(request);

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { postId } = await request.json();

		// Verify post ownership by matching author->clerk_id
		const post = await client.fetch(
			`*[_type == "post" && _id == $postId && author->clerk_id == $userId][0]`,
			{ postId, userId }
		);

		if (!post) {
			return NextResponse.json(
				{ error: "Post not found or unauthorized" },
				{ status: 403 }
			);
		}

		// Begin transaction
		const transaction = client.transaction();

		// Delete image asset if it exists
		if (post.mainImage?.asset?._ref) {
			const assetRef: string = post.mainImage.asset._ref;
			transaction.delete(assetRef);
			console.log(`Deleted image asset: ${assetRef}`);
		}

		// Delete the post document
		transaction.delete(postId);
		console.log(`Deleted post document: ${postId}`);

		// Fetch savedPost documents containing the postId
		const savedPosts = await client.fetch(
			`*[_type == "savedPost" && posts[post._ref == $postId]]`,
			{ postId }
		);

		console.log(
			`Found ${savedPosts.length} savedPost document(s) containing postId ${postId}.`
		);

		// Iterate through each savedPost and remove the specific post reference
		savedPosts.forEach((savedPost: any) => {
			const updatedPosts = savedPost.posts.filter(
				(p: any) => p.post._ref !== postId
			);

			console.log(
				`Updating savedPost ${savedPost._id}: Removing postId ${postId}.`
			);

			// Corrected patch usage
			transaction.patch(savedPost._id, { set: { posts: updatedPosts } });
		});

		// Commit the transaction
		await transaction.commit();
		console.log("Transaction committed successfully.");

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Delete error:", error);

		if (error.isClientError && error.response) {
			console.error(
				"Client error details:",
				JSON.stringify(error.response.body, null, 2)
			);
		}

		return NextResponse.json(
			{ error: "Failed to delete post" },
			{ status: 500 }
		);
	}
}
