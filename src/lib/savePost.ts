// src/lib/savePost.ts

import client from "@/lib/sanityClient";

// Function to generate a unique key for array items
function generateUniqueKey() {
	return Math.random().toString(36).substring(2, 15);
}

export async function savePostForUser(userId: string, postId: string) {
	// Create the savedPost document
	const savedPostData = {
		_type: "savedPost",
		user: userId,
		posts: [
			{
				_key: generateUniqueKey(),
				post: {
					_type: "reference",
					_ref: postId,
					_weak: true, // Include the _weak property
				},
				savedAt: new Date().toISOString(),
			},
		],
	};

	// Save the document to Sanity
	await client.create(savedPostData);
}
