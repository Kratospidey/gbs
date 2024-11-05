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
    return <div>Please log in to see your saved posts</div>;
  }

  const savedPosts = await client.fetch(query, { userId: user.id });

  if (!savedPosts || !savedPosts.posts.length) {
    return <div>No saved posts found</div>;
  }

  return <SavedPostsList posts={savedPosts.posts} />;
}
