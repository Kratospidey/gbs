// components/SavedPostsList.tsx
import PostCard from "./PostCard";
import { Post } from "@/types/post";

interface SavedPostsListProps {
	posts: {
		post: Post;
		savedAt: string;
	}[];
}

export default function SavedPostsList({ posts }: SavedPostsListProps) {
	return (
		<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			{posts.map(({ post, savedAt }) => (
				<div key={post._id}>
					<PostCard post={{ ...post, status: "published" }} />
					<p className="mt-2 text-sm text-gray-500">
						Saved on {new Date(savedAt).toLocaleDateString()}
					</p>
				</div>
			))}
		</div>
	);
}
