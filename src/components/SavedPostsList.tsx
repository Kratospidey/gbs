// components/SavedPostsList.tsx
import React from "react";
import SavedPostCard from "./SavedPostCard";

interface Author {
	name: string;
	image: any;
}

interface Post {
	_id: string;
	title: string;
	slug: any;
	mainImage: any;
	description: string;
	author: Author;
	publishedAt: string;
}

interface SavedPost {
	post: Post;
	savedAt: string;
}

interface SavedPostsListProps {
	posts: SavedPost[];
}

const SavedPostsList: React.FC<SavedPostsListProps> = ({ posts }) => {
	return (
		<div className="flex flex-wrap -mx-1 max-w-7xl mx-auto gap-3 justify-center">
			{posts
				.filter((savedPost) => savedPost.post !== null) // Filter out null posts
				.map((savedPost) => (
					<div key={savedPost.post!._id}>
						{/* Pass the entire SavedPost object with the correct prop name */}
						<SavedPostCard savedPost={savedPost} />
					</div>
				))}
		</div>
	);
};

export default SavedPostsList;
