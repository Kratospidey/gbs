"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import { Button } from "@/components/ui/button";

// Define the Post interface
interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;  // Assuming you have a content field
  publishedAt: string;
  mainImage?: {
    asset: {
      url: string;
    };
  };
}

interface EditPostProps {
  params: { slug: string };
}

const EditPostPage: React.FC<EditPostProps> = ({ params }) => {
  const { slug } = params;
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    // Fetch the post data by slug
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const data: Post = await client.fetch(
          `*[_type == "post" && slug.current == $slug && author._ref == $userId][0]{
            _id,
            title,
            slug,
            content,
            publishedAt,
            mainImage {
              asset-> {
                url
              }
            }
          }`,
          { slug, userId: user.id }
        );
        setPost(data);
      } catch (error) {
        console.error("Error fetching post:", error);
      }
      setIsLoading(false);
    };

    fetchPost();
  }, [slug, user]);

  const handleSave = async () => {
    if (!post) return;

    try {
      // Update the post using Sanity's patch API
      await client.patch(post._id).set({
        title: post.title,
        content: post.content,
        mainImage: post.mainImage,
        // You could add more fields here if needed
      }).commit();

      alert("Post updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update the post. Please try again.");
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!post) {
    return <p className="text-destructive">Post not found or you do not have permission to edit it.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Post: {post.title}</h1>
      <div className="mb-4">
        <label htmlFor="title" className="block text-lg font-medium">Title</label>
        <input
          id="title"
          type="text"
          value={post.title}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
          className="w-full px-4 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="content" className="block text-lg font-medium">Content</label>
        <textarea
          id="content"
          rows={8}
          value={post.content}
          onChange={(e) => setPost({ ...post, content: e.target.value })}
          className="w-full px-4 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="mainImage" className="block text-lg font-medium">Main Image URL</label>
        <input
          id="mainImage"
          type="text"
          value={post.mainImage?.asset?.url || ""}
          onChange={(e) =>
            setPost({
              ...post,
              mainImage: {
                asset: { url: e.target.value },
              },
            })
          }
          className="w-full px-4 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
      <Button onClick={handleSave} className="bg-primary text-primary-foreground">
        Save Changes
      </Button>
    </div>
  );
};

export default EditPostPage;
