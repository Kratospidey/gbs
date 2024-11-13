// src/lib/updateSavedPost.ts

import client from "@/lib/sanityClient";

// Function to generate a unique key for array items
function generateUniqueKey() {
	return Math.random().toString(36).substring(2, 15);
}

export async function addPostToSavedPost(savedPostId: string, postId: string) {
	const newPostItem = {
		_key: generateUniqueKey(),
		post: {
			_type: "reference",
			_ref: postId,
			_weak: true, // Include the _weak property
		},
		savedAt: new Date().toISOString(),
	};

	await client
		.patch(savedPostId)
		.setIfMissing({ posts: [] })
		.append("posts", [newPostItem])
		.commit();
}
