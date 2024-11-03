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
import client from '@/lib/sanityClient';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@clerk/nextjs';
import { v4 as uuidv4 } from 'uuid';
import DarkModeToggle from '@/components/DarkModeToggle';
import MarkdownEditor from '@/components/MarkdownEditor';


interface Post {
  _id: string;
  title: string;
  body: string;
  mainImage: {
    asset: {
      _ref: string;
      _type: string;
    };
  } | null;
  author: {
    _ref: string;
    _type: string;
  };
  publishedAt: string;
  categories: any[];
  updatedAt?: string;
}

interface EditPostProps {
  params: {
    slug: string;
  };
}

const EditPost: React.FC<EditPostProps> = ({ params }) => {
  const { user } = useUser();
  const router = useRouter();
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [postId, setPostId] = useState<string>('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Log the slug we're querying
        console.log('Fetching post with slug:', params.slug);

        // Modify query to explicitly select all fields we need
        const fetchedPost = await client.fetch(`
          *[_type == "post" && slug.current == $slug][0] {
            _id,
            title,
            body,
            mainImage,
            "slug": slug.current
          }
        `, { slug: params.slug });

        // Log the fetched post
        console.log('Fetched post:', fetchedPost);

        if (fetchedPost) {
          setPostId(fetchedPost._id);
          setTitle(fetchedPost.title || '');
          // Ensure body content is being set
          if (fetchedPost.body) {
            console.log('Setting content:', fetchedPost.body);
            setContent(fetchedPost.body);
          } else {
            console.log('No body content found');
            setContent('');
          }
          
          if (fetchedPost.mainImage?.asset?._ref) {
            // Assuming the _ref is in the format 'image-<hash>-<extension>'
            // and Supabase storage path is 'public/<hash>.<extension>'
            const imageRef = fetchedPost.mainImage.asset._ref;
            // Parse the imageRef to extract the hash and extension
            // Example: 'image-abc123-def456.png'
            const match = imageRef.match(/^image-([a-zA-Z0-9]+)-([a-zA-Z0-9]+)\.(jpg|jpeg|png|gif)$/);
            if (match) {
              const hash = match[1];
              const extension = match[3];
              const fileName = `${hash}.${extension}`;
              const { data: urlData } = supabase
                .storage
                .from('post_banners')
                .getPublicUrl(`public/${fileName}`);

              if (!urlData) {
                console.error('Error getting public URL');
              } else if (urlData.publicUrl) { // Use 'publicUrl' with lowercase 'u'
                setExistingMainImageUrl(urlData.publicUrl);
              }
            } else {
              console.error('Unexpected image ref format:', imageRef);
            }
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

  const handleSubmit = async () => {
    if (!user) {
      alert('You need to be logged in to edit a post.');
      return;
    }

    setIsLoading(true);
    let mainImageRef: string = '';

    // Handle main image upload if a new image is selected
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
          // Upload the image to Sanity and get its reference
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

    // Update the post in Sanity
    const updatedPost: Partial<Post> = {
      title: title,
      body: content, // 'content' contains HTML with image URLs
      mainImage: mainImageRef
        ? {
            asset: {
              _ref: mainImageRef,
              _type: 'reference',
            },
          }
        : undefined, // Do not update if no new image
      updatedAt: new Date().toISOString(),
    };

    try {
      await client.patch(postId).set(updatedPost).commit();
      alert('Post updated successfully!');
      router.push(`/posts/${params.slug}`);
    } catch (error) {
      console.error('Failed to update post in Sanity:', error);
      alert('Failed to update post. Please try again.');
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
              <MarkdownEditor 
                initialContent={content} 
                onChange={(newContent) => setContent(newContent)} 
              />
              </div>
            </div>
            <div>
              <Label htmlFor="mainImage" className="dark:text-white">
                Main Image
              </Label>
              {existingMainImageUrl && (
                <img 
                  src={existingMainImageUrl} 
                  alt="Existing Main Image" 
                  className="mb-2 w-full h-auto" 
                />
              )}
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
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="dark:bg-gray-700 dark:text-white"
          >
            {isLoading ? 'Updating...' : 'Update'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditPost;
