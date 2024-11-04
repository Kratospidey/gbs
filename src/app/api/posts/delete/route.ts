import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import client from "@/lib/sanityClient";
import { getAuth } from "@clerk/nextjs/server";

export async function DELETE(request: NextRequest) {
	try {
		const { userId } = getAuth(request);

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { postId, imageUrl } = await request.json();

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

		const supabase = createRouteHandlerClient({ cookies });

		// Delete from Sanity
		await client.delete(postId);

		// Delete image from Supabase if exists
		if (imageUrl) {
			const fileName = imageUrl.split("/").pop();
			await supabase.storage
				.from("post_banners")
				.remove([`public/${fileName}`]);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete error:", error);
		return NextResponse.json(
			{ error: "Failed to delete post" },
			{ status: 500 }
		);
	}
}
