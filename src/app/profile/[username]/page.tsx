// src/app/profile/[username]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Tag } from "@/components/Tag";
import Image from "next/image";
import { LinkPreview } from "@/components/ui/link-preview";
import ProfilePostCard from "@/components/ProfilePostCard"; // Import the 3D ProfilePostCard component
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Update UserProfile interface to match Supabase columns
interface UserProfile {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    bio: string;
    profile_picture?: string;
    github?: string; // matches Supabase column
    linkedin?: string; // matches Supabase column
    custom_link?: string; // matches Supabase column
    username: string;
}

// Update UserPost interface to include _id
interface UserPost {
    _id: string;
    title: string;
    slug: string;
    publishedAt: string;
    mainImageUrl?: string;
    status: "pending" | "published" | "draft" | "archived";
    tags?: string[];
}

const UserProfilePage = () => {
    const { username } = useParams();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<UserPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/profile/${username}`);
                const data = await res.json();
                
                console.log("Raw API data:", data);
                console.log("Fetching profile for:", username); // Debug log

                console.log("API Response:", data); // Debug log
                console.log("Raw post data:", data.posts);

                if (!res.ok) throw new Error(data.error);

                setUser(data.user);

                console.log("All Posts:", data.posts); // Debug log

                // Enhanced filter logic with mapping 'id' to '_id'
                const filteredPosts: UserPost[] = data.posts
                    .filter((post: any) => post.status === "published")
                    .map((post: any) => ({
                        _id: post.id || post._id,
                        title: post.title,
                        slug: post.slug,
                        // Ensure publishedAt is properly formatted
                        publishedAt: post.publishedAt || post.created_at || new Date().toISOString(),
                        mainImageUrl: post.image_url || post.mainImage?.asset?.url,
                        status: post.status || "published",
                        tags: post.tags || [],
                    }));

                console.log("Published Posts:", filteredPosts); // Debug log

                setPosts(filteredPosts);
            } catch (error) {
                console.error("Error:", error);
                toast.error("Failed to load profile.");
            } finally {
                setIsLoading(false);
            }
        };

        if (username) {
            fetchProfile();
        }
    }, [username]);

    if (isLoading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    if (!user)
        return (
            <div className="min-h-screen flex items-center justify-center">
                User not found
            </div>
        );

    return (
        <div className="min-h-screen">
            <ToastContainer />
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>
            <div className="container max-w-4xl mx-auto px-4 py-12">
                <div className="flex items-center space-x-6 mb-8">
                    <Avatar className="h-24 w-24">
                        <AvatarImage
                            src={user.profile_picture || "/default-avatar.png"}
                            alt={`${user.first_name} ${user.last_name}`}
                        />
                        <AvatarFallback>
                            {user?.first_name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-3xl font-bold text-foreground">
                                {`${user.first_name} ${user.last_name}`}
                            </h2>
                            <p className="text-muted-foreground">@{user.username}</p>
                        </div>

                        <p className="text-foreground">{user.bio}</p>

                        <div className="flex gap-3">
                            {user.github && (
                                <Button variant="outline" size="icon" asChild>
                                    <LinkPreview url={user.github}>
                                        <FaGithub className="h-5 w-5" />
                                    </LinkPreview>
                                </Button>
                            )}

                            {user.linkedin && (
                                <Button variant="outline" size="icon" asChild>
                                    <LinkPreview url={user.linkedin}>
                                        <FaLinkedin className="h-5 w-5" />
                                    </LinkPreview>
                                </Button>
                            )}

                            {user.custom_link && (
                                <Button variant="outline" size="icon" asChild>
                                    <LinkPreview url={user.custom_link}>
                                        <FaGlobe className="h-5 w-5" />
                                    </LinkPreview>
                                </Button>
                            )}

                            <Button variant="outline" size="icon" asChild>
                                <a href={`mailto:${user.email}`} title={user.email}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-5 w-5"
                                    >
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* User's Published Posts */}
                <div>
                    <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                        Published Posts
                    </h3>
                    {posts.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-400">
                            No published posts yet.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-60">
                            {posts.map((post) => (
                                <ProfilePostCard key={post._id} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
