// components/SavedPostsList.tsx
import React from "react";
import SavedPostCard from "./SavedPostCard";

interface SavedPostsListProps {
	posts: any[];
}

const SavedPostsList: React.FC<SavedPostsListProps> = ({ posts }) => {
	return (
		<div className="flex flex-wrap -mx-1 max-w-7xl mx-auto gap-3 justify-center">
			{posts.map((post) => (
				<div className="" key={post.post._id}>
					<SavedPostCard post={post} />
				</div>
			))}
		</div>
	);
};

export default SavedPostsList;
