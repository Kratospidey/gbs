// src/app/posts/create/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import client from '@/lib/sanityClient';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@clerk/nextjs';
import { v4 as uuidv4 } from 'uuid';
import DarkModeToggle from '@/components/DarkModeToggle';
import TipTapEditor from '@/components/MarkdownEditor';
import { Tag } from '@/components/Tag';
import { useRouter } from 'next/navigation';

const CreatePost: React.FC = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Move all state declarations before any conditionals
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Auth check effect
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/signin');
    }
  }, [isLoaded, user, router]);

  // Loading state after state declarations
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('You need to be logged in to create a post.');
      return;
    }

    setIsLoading(true);
    let mainImageRef: string = '';

    // Check if user exists in Sanity
    try {
      const existingUser = await client.fetch(
        `*[_type == "author" && _id == $userId][0]`,
        { userId: user.id }
      );

      // If the user does not exist, create the user in Sanity
      if (!existingUser) {
        const newUser = {
          _type: 'author',
          _id: user.id,
          name: user.username || 'Anonymous',
        };

        await client.create(newUser);
        console.log('User created in Sanity:', newUser);
      }
    } catch (error) {
      console.error('Error checking or creating user in Sanity:', error);
      alert('Failed to check or create user. Please try again.');
      setIsLoading(false);
      return;
    }

    // Handle main image upload to Supabase and Sanity
    if (mainImage) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post_banners')
          .upload(`public/${uuidv4()}_${mainImage.name}`, mainImage, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading image to Supabase:', uploadError);
          alert('Failed to upload main image. Please try again.');
          setIsLoading(false);
          return;
        }

        if (uploadData) {
          // Optionally, you can also store the image in Sanity if needed
          const imageUploadResponse = await client.assets.upload('image', mainImage);
          mainImageRef = imageUploadResponse._id;
        }
      } catch (error) {
        console.error('Error uploading image to Sanity:', error);
        alert('Failed to upload main image. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Create new post in Sanity
    const newPost = {
      _type: 'post',
      title: title,
      body: content, // 'content' contains HTML with image URLs
      author: {
        _type: 'reference',
        _ref: user.id,
      },
      mainImage: mainImageRef
        ? {
            _type: 'image',
            asset: {
              _ref: mainImageRef,
              _type: 'reference',
            },
          }
        : null,
      publishedAt: new Date().toISOString(),
      categories: [],
      status: 'pending', // Always set to pending on create/update
      tags: tags, // Add this line
    };

    try {
      await client.create(newPost);
      alert('Post created successfully!');
      setTitle('');
      setContent('');
      setMainImage(null);
    } catch (error) {
      console.error('Failed to create post in Sanity:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
      <DarkModeToggle />
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Create a New Post</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Fill in the details to create a new blog post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
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
            <div>
              <Label htmlFor="content" className="dark:text-white">
                Content
              </Label>
              <div className="prose-container border rounded-md p-4 dark:bg-gray-700">
                <TipTapEditor 
                  initialContent=""
                  onChange={setContent}
                />
              </div>
            </div>
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
            </div>
            <div className="mb-4">
              <label className="block mb-2">Tags</label>
              <div className="flex flex-wrap mb-2">
                {tags.map((tag) => (
                  <Tag 
                    key={tag} 
                    text={tag}
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                  />
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Add tags (press Enter or comma to add)"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="dark:bg-gray-700 dark:text-white"
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreatePost;
