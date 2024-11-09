// src/app/saved/page.tsx
import client from "@/lib/sanityClient";
import { groq } from "next-sanity";
import { getCurrentUser } from "@/lib/session";
import SavedPostsList from "@/components/SavedPostsList";

const query = groq`
  *[_type == "savedPost" && user == $userId][0]{
    posts[]{
      post->{
        _id,
        title,
        slug,
        mainImage,
        description,
        author->{
          name,
          image
        },
        categories[]->{
          title,
          description
        },
        publishedAt
      },
      savedAt
    }
  }`;

export default async function SavedPostsPage() {
	const user = await getCurrentUser();

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center p-6 bg-white rounded shadow-md">
					<h2 className="text-2xl font-semibold mb-4">Please log in</h2>
					<p className="text-gray-600">Log in to see your saved posts.</p>
				</div>
			</div>
		);
	}

	const savedPosts = await client.fetch(query, { userId: user.id });

	if (!savedPosts || !savedPosts.posts.length) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center p-6 bg-white rounded shadow-md">
					<h2 className="text-2xl font-semibold mb-4">No saved posts found</h2>
					<p className="text-gray-600">You haven't saved any posts yet.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Your Saved Posts</h1>
			<SavedPostsList posts={savedPosts.posts} />
		</div>
	);
}
