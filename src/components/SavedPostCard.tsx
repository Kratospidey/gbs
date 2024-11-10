// src/components/SavedPostCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import Link from "next/link";
import { urlFor } from "@/lib/imageUrlBuilder";

interface Author {
  name: string;
  image: string | null;
  username?: string; // Make username optional since it might not be present
}

interface SavedPost {
  post: {
    _id: string;
    title: string;
    slug: {
      current: string;
    };
    mainImage?: {
      asset: {
        _ref: string;
      };
    };
    publishedAt: string;
    author: Author;
  };
  savedAt: string;
}

interface SavedPostCardProps {
  post: SavedPost;
}

const SavedPostCard: React.FC<SavedPostCardProps> = ({ post }) => {
  const router = useRouter();
  const { post: postData, savedAt } = post;

  // Debug log
  console.log("Author data:", postData.author);

  const imageUrl = postData.mainImage?.asset?._ref
    ? urlFor(postData.mainImage).url()
    : "/default-thumbnail.jpg";

  const handleView = () => {
    router.push(`/posts/${postData.slug.current}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use author's name as fallback for username
    const authorIdentifier = postData.author?.name?.toLowerCase().replace(/\s+/g, '');
    if (authorIdentifier) {
      router.push(`/profile/${authorIdentifier}`);
    } else {
      console.error("Author identifier not found");
    }
  };

  return (
    <CardContainer className="inter-var">
      <CardBody className="bg-gray-800 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-[#1f2937] dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[21rem] h-auto rounded-xl p-6 border">
        <CardItem
          translateZ={50}
          className="text-xl font-bold text-white cursor-pointer"
          onClick={handleView}
        >
          {postData.title}
        </CardItem>

        <CardItem
          as="p"
          translateZ={60}
          className="text-gray-300 text-sm max-w-sm mt-2"
        >
          {postData.author && (
            <button
              onClick={handleAuthorClick}
              className="text-blue-400 hover:underline inline-block mr-2"
            >
              By @{postData.author.name}
            </button>
          )}
        </CardItem>

        <CardItem translateZ={100} className="w-full mt-4">
          <Image
            src={imageUrl}
            alt={postData.title}
            width={400}
            height={200}
            className="h-40 w-full object-cover rounded-xl group-hover/card:shadow-xl"
            priority={true}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/default-thumbnail.jpg";
            }}
          />
        </CardItem>

        <div className="flex flex-col gap-2 mt-4">
          <CardItem as="p" translateZ={40} className="text-gray-400 text-xs">
            Published: {new Date(postData.publishedAt).toLocaleDateString()}
          </CardItem>
          <CardItem as="p" translateZ={40} className="text-gray-400 text-xs">
            Saved: {new Date(savedAt).toLocaleDateString()}
          </CardItem>
        </div>

        <div className="flex justify-between items-center mt-6">
          <CardItem
            translateZ={20}
            as={Link}
            href={`/posts/${postData.slug.current}`}
            className="px-4 py-2 rounded-xl text-xs font-normal text-white"
          >
            Read Post →
          </CardItem>
          {postData.author && (
            <CardItem
              translateZ={20}
              as={Link}
              href={`/profile/${postData.author.name.toLowerCase().replace(/\s+/g, '')}`}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              View Author
            </CardItem>
          )}
        </div>
      </CardBody>
    </CardContainer>
  );
};

export default SavedPostCard;
