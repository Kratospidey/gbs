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
          router.push('/');
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
    <div className="container max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
          <p className="text-sm text-muted-foreground">
            Modify and update your blog post
          </p>
        </div>
        <DarkModeToggle />
      </div>
      
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
        <CardHeader className="backdrop-blur-xl">
          <CardTitle className="text-xl font-semibold">Post Details</CardTitle>
          <CardDescription>
            Update the information below to modify your post
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              className="h-10 border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* Content Field */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Content <span className="text-red-500">*</span>
            </Label>
            <div className="prose-container rounded-md border border-zinc-200 dark:border-zinc-800">
              <MarkdownEditor
                initialContent={content}
                onChange={(newContent) => setContent(newContent)}
              />
            </div>
          </div>

          {/* Main Image Field */}
          <div className="space-y-2">
            <Label htmlFor="mainImage" className="text-sm font-medium">
              Featured Image
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setMainImage(e.target.files[0]);
                }
              }}
              className="h-10 border-zinc-200 dark:border-zinc-800"
            />
            {existingMainImageUrl && (
              <Image
                src={existingMainImageUrl}
                alt="Existing Main Image"
                width={250}
                height={250}
                className="mt-2 rounded-md"
              />
            )}
          </div>

          {/* Tags Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Tag
                  key={tag}
                  text={tag}
                  isEditable={true}
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                />
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="Add tags (press Enter or comma to add)"
              className="h-10 border-zinc-200 dark:border-zinc-800"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-4 pt-6">
          <Button
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={isLoading}
            className="h-9 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {isLoading ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => handleSubmit("published")}
            disabled={isLoading}
            className="h-9 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900"
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditPost;
