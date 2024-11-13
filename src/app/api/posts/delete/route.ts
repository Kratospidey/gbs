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

		// Begin transaction
		const transaction = client.transaction();

		// Delete image asset if it exists
		if (post.mainImage?.asset?._ref) {
			const assetRef: string = post.mainImage.asset._ref;
			transaction.delete(assetRef);
		}

		// Delete the post document
		transaction.delete(postId);

		// Commit the transaction
		await transaction.commit();

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
