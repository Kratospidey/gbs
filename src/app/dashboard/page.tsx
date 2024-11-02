"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import DarkModeToggle from "@/components/DarkModeToggle";

// Define the Post interface
interface Post {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  mainImage?: {
    asset: {
      url: string;
    };
  };
}

const DashboardPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<"published" | "drafts" | "archived">("published");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        let query = "*[_type == 'post' && author._ref == $userId";

        switch (filter) {
          case "drafts":
            query += " && _id in path('drafts.**')";
            break;
          case "archived":
            query += " && archived == true";
            break;
          default:
            query += " && !(_id in path('drafts.**')) && archived != true";
        }

        query += "] | order(publishedAt desc) { _id, title, slug, publishedAt, mainImage{ asset->{ url } } }";

        const data: Post[] = await client.fetch(query, { userId: user.id });
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts: ", error);
      }
      setIsLoading(false);
    };

    fetchPosts();
  }, [user, filter]);

  const handleDelete = async (postId: string, imageUrl: string | undefined) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      await client.delete(postId);
      if (imageUrl) {
        const fileName = imageUrl.split("/").pop();
        const { error } = await supabase.storage
          .from("post_banners")
          .remove([`public/${fileName}`]);
        if (error) {
          console.error("Error deleting image from Supabase: ", error);
        }
      }
      setPosts(posts.filter((post) => post._id !== postId));
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
    setIsLoading(false);
  };

  const handleEdit = (slug: string) => {
    router.push(`/posts/edit/${slug}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <DarkModeToggle />
      <h1 className="text-4xl font-bold mb-6 text-foreground">My Posts</h1>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-6 mb-8">
        {["Published", "Drafts", "Archived"].map((label) => (
          <button
            key={label}
            onClick={() => setFilter(label.toLowerCase() as "published" | "drafts" | "archived")}
            className={`tab ${filter === label.toLowerCase() ? "tab-selected" : "tab-default"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Post Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : posts.length > 0 ? (
          posts.map((post: Post) => (
            <div
              key={post._id}
              className="group relative neomorph-card p-6"
            >
              {post.mainImage?.asset?.url && (
                <img
                  src={post.mainImage.asset.url}
                  alt={post.title}
                  className="w-full h-48 object-cover mb-4 rounded-md shadow-sm transition-transform transform hover:scale-105"
                />
              )}
              <div className="text-center">
                <h2 className="text-xl font-bold text-card-foreground mb-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
                <div className="flex justify-center gap-4 mt-2">
                  <button
                    onClick={() => handleEdit(post.slug)}
                    className="button-base bg-accent text-accent-foreground py-2 px-6"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post._id, post.mainImage?.asset?.url)}
                    className="button-base bg-destructive text-destructive-foreground py-2 px-6"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No posts found. Create your first post!</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
