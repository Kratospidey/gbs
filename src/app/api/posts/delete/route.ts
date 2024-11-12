// src/app/api/delete/route.ts
import { NextResponse, NextRequest } from "next/server";
import client from "@/lib/sanityClient";
import { getAuth } from "@clerk/nextjs/server";

export async function DELETE(request: NextRequest) {
	try {
		const { userId } = getAuth(request);

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { postId } = await request.json();

		// Verify post ownership
		const post = await client.fetch(
			`*[_type == "post" && _id == $postId && author._ref == $userId][0]`,
			{ postId, userId }
		);

		if (!post) {
			return NextResponse.json(
				{ error: "Post not found or unauthorized" },
				{ status: 403 }
			);
		}

		// Delete image asset from Sanity if it exists
		if (post.mainImage?.asset?._ref) {
			const assetRef: string = post.mainImage.asset._ref; // e.g., "image-abc123-200x200-png"
			const assetId = assetRef.split("-").slice(0, 2).join("-"); // Extract "image-abc123"

			try {
				// Use client.delete to remove the asset by its ID
				await client.delete(assetId);
				console.log(`Deleted image asset: ${assetId}`);
			} catch (assetError) {
				console.error(`Failed to delete image asset ${assetId}:`, assetError);
				// Continue to delete the post even if image deletion fails
			}
		}

		// Delete the post document
		await client.delete(postId);
		console.log(`Deleted post: ${postId}`);

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Delete error:", error);
		return NextResponse.json(
			{ error: "Failed to delete post" },
			{ status: 500 }
		);
	}
}
