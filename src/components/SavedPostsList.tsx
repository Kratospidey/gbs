// components/SavedPostsList.tsx
import React from "react";
import SavedPostCard from "./SavedPostCard";

interface SavedPostsListProps {
  posts: any[];
}

const SavedPostsList: React.FC<SavedPostsListProps> = ({ posts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <SavedPostCard key={post.post._id} post={post} />
      ))}
    </div>
  );
};

export default SavedPostsList;
