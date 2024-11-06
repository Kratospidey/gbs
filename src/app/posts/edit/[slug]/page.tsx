"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import client, { urlFor } from '@/lib/sanityClient';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@clerk/nextjs';
import { v4 as uuidv4 } from 'uuid';
import DarkModeToggle from '@/components/DarkModeToggle';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Tag } from '@/components/Tag';
import Image from "next/image";

interface Post {
  _id: string;
  title: string;
  body: string;
  mainImage:
    | {
        _type: 'image';
        asset: {
          _ref: string;
          _type: 'reference';
        };
      }
    | {
        asset: {
          _id: string;
          url: string;
        };
      }
    | null;
  author: {
    _ref: string;
    _type: string;
  };
  publishedAt: string;
  categories: any[];
  _updatedAt: string;
  status: string;
  tags: string[];
}

interface EditPostProps {
  params: {
    slug: string;
  };
}

const EditPost: React.FC<EditPostProps> = ({ params }) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // State declarations
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [postId, setPostId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Auth check effect
  useEffect(() => {
    if (isLoaded && !user) {
      router.push(`/signin`);
    }
  }, [isLoaded, user, router, params.slug]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const fetchedPost = await client.fetch(
          `*[_type == "post" && slug.current == $slug][0] {
            _id,
            title,
            body,
            mainImage {
              asset-> {
                _id,
                url
              }
            },
            tags,
            "slug": slug.current,
            _updatedAt
          }`,
          { slug: params.slug }
        );

        if (fetchedPost) {
          setPostId(fetchedPost._id);
          setTitle(fetchedPost.title || '');
          setContent(fetchedPost.body || '');
          setTags(fetchedPost.tags || []);
          if (fetchedPost.mainImage?.asset?.url) {
            setExistingMainImageUrl(fetchedPost.mainImage.asset.url);
          }
        } else {
          alert('Post not found.');
          router.push('/posts');
        }
      } catch (error) {
        console.error('Error details:', error);
        alert('Failed to fetch post');
        router.push('/posts');
      }
    };

    fetchPost();
  }, [params.slug, router]);

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput("");
    }
  };

  const handleSubmit = async (status: string) => {
    if (!user) {
      alert("You need to be logged in to edit a post.");
      return;
    }

    setIsLoading(true);
    let mainImageRef: string = "";

    // Handle main image upload if a new image is selected
    if (mainImage) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("post_banners")
          .upload(`public/${uuidv4()}_${mainImage.name}`, mainImage, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading image to Supabase:", uploadError);
          alert("Failed to upload main image. Please try again.");
          setIsLoading(false);
          return;
        }

        if (uploadData) {
          // Upload the image to Sanity and get its reference
          const imageUploadResponse = await client.assets.upload("image", mainImage);
          mainImageRef = imageUploadResponse._id;
        }
      } catch (error) {
        console.error("Error uploading image to Sanity:", error);
        alert("Failed to upload main image. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    // Update the post in Sanity
    const updatedPost: Partial<Post> = {
      title: title,
      body: content, // 'content' contains markdown
      status, // Use the passed status
      tags: tags, // Add this line
      // Only update mainImage if a new one is selected
      ...(mainImage
        ? {
            mainImage: {
              _type: "image",
              asset: {
                _ref: mainImageRef,
                _type: "reference",
              },
            },
          }
        : {}),
    };

    try {
      await client.patch(postId).set(updatedPost).commit();
      alert("Post updated successfully!");
      router.push(`/posts/${params.slug}`);
    } catch (error) {
      console.error("Failed to update post in Sanity:", error);
      alert("Failed to update post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
      <DarkModeToggle />
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Edit Post</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Modify the details of your blog post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Title Field */}
            <div>
              <Label htmlFor="title" className="dark:text-white">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Content Field */}
            <div>
              <Label htmlFor="content" className="dark:text-white">
                Content
              </Label>
              <div className="prose-container border rounded-md p-4 dark:bg-gray-700">
                <MarkdownEditor
                  initialContent={content}
                  onChange={(newContent) => setContent(newContent)}
                />
              </div>
            </div>

            {/* Main Image Field */}
            <div>
              <Label htmlFor="mainImage" className="dark:text-white">
                Main Image
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setMainImage(e.target.files[0]);
                  }
                }}
                className="dark:bg-gray-700 dark:text-white"
              />
              {existingMainImageUrl && (
                <Image
                  src={existingMainImageUrl}
                  alt="Existing Main Image"
                  width={250}
                  height={250}
                  className="mt-4 rounded-md"
                />
              )}
            </div>

            {/* Tags Field */}
            <div className="mb-4">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Add tags (press Enter or comma to add)"
                className="w-full p-2 border rounded"
              />
              <div className="flex flex-wrap mt-2">
                {tags.map((tag) => (
                  <Tag
                    key={tag}
                    text={tag}
                    isEditable={true}
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button
            onClick={() => handleSubmit("draft")}
            disabled={isLoading}
            className="bg-gray-500 text-white"
          >
            {isLoading ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => handleSubmit("published")}
            disabled={isLoading}
            className="bg-blue-600 text-white"
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditPost;
