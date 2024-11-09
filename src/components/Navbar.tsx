// components/Navbar.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
	Cog,
	User,
	LayoutDashboard,
	Bookmark,
	Pencil,
	Search,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useUser, useClerk } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandItem,
} from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";

interface SearchResult {
	_id: string;
	title: string;
	slug: {
		current: string;
	};
}

const Navbar: React.FC = () => {
	const router = useRouter();
	const { user, isLoaded, isSignedIn } = useUser();
	const clerk = useClerk();
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isCommandOpen, setIsCommandOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;

		const performSearch = async () => {
			if (searchQuery.length >= 2) {
				setIsLoading(true);
				const lowerQuery = searchQuery.toLowerCase().trim();
				const words = lowerQuery.split(/\s+/);

				console.log("Search query:", searchQuery);
				console.log("Processed words:", words);

				try {
					const searchTerms = {
						exact: lowerQuery,
						prefix: words.map((word) => `${word}*`).join(" "),
						contains: words.map((word) => `*${word}*`).join(" "),
						fuzzy: words
							.map((word) => `${word.split("").join("*")}*`)
							.join(" "),
					};

					console.log("Search terms:", searchTerms);

					const results = await client.fetch<SearchResult[]>(
						`*[_type == "post" && title != null && (
              lower(title) == $exact ||
              title match $prefix ||
              title match $contains ||
              title match $fuzzy
            )]{
              _id,
              title,
              slug
            }[0...10]`,
						searchTerms
					);

					console.log("Sanity results:", results);
					setSearchResults(results);
				} catch (error) {
					console.error("Search error details:", error);
					setSearchResults([]);
				} finally {
					setIsLoading(false);
				}
			} else {
				console.log("Query too short:", searchQuery);
				setSearchResults([]);
			}
		};

		// Debounce the search
		timeoutId = setTimeout(performSearch, 300);

		return () => clearTimeout(timeoutId);
	}, [searchQuery]);

	useEffect(() => {
		console.log("Search results updated:", searchResults);
	}, [searchResults]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);
	};

	const handleDeleteAccount = async () => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete your account?"
		);
		if (!confirmDelete) return;

		try {
			const response = await fetch("/api/deleteAccount", {
				method: "DELETE",
			});
			if (response.ok) {
				await clerk.signOut();
				alert("Account deleted successfully.");
			} else {
				const error = await response.json();
				alert(`Error: ${error.message}`);
			}
		} catch (error) {
			console.error("Delete account error:", error);
			alert("Failed to delete account.");
		}
	};

	// Debug logs moved here
	useEffect(() => {
		console.log("Rendering CommandList with:", {
			isLoading,
			resultsLength: searchResults.length,
			searchQuery,
		});
	}, [isLoading, searchResults.length, searchQuery]);

	return (
		<>
			<nav
				className={`fixed top-0 w-full z-50 transition-colors duration-300 backdrop-blur-custom ${
					isScrolled
						? "bg-white/50 dark:bg-gray-900/50 border-b border-[#708090]/50"
						: "bg-white/50 dark:bg-gray-900/50"
				}`}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16 items-center">
						{/* Left Section */}
						<Link
							href="/"
							className="text-2xl font-bold text-gray-800 dark:text-white"
						>
							Babel
						</Link>

						{/* Right Section */}
						<div className="flex items-center space-x-4">
							{/* Search Button */}
							<button
								onClick={() => setIsCommandOpen(true)}
								className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
								title="Search"
							>
								<Search className="h-6 w-6" />
							</button>

							{isSignedIn && (
								<>
									{/* Saved Posts */}
									<Link
										href="/saved"
										className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
										title="Saved Posts"
									>
										<Bookmark className="h-6 w-6" />
									</Link>

									{/* Dashboard */}
									<Link
										href="/dashboard"
										className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
										title="Dashboard"
									>
										<LayoutDashboard className="h-6 w-6" />
									</Link>

									{/* Create Post */}
									<Link
										href="/posts/create"
										className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
										title="Create Post"
									>
										<Pencil className="h-6 w-6" />
									</Link>

									{/* Profile Dropdown */}
									<div className="relative group">
										<button
											className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
											title="User Profile"
										>
											<User className="h-6 w-6" />
										</button>
										<div
											className="absolute right-0 mt-2 w-48 bg-white/70 dark:bg-gray-800/70 backdrop-blur-custom rounded-md shadow-lg 
                      opacity-0 group-hover:opacity-100 
                      transition-all duration-300 ease-in-out transform 
                      -translate-y-1 group-hover:translate-y-0"
										>
											{user && (
												<Link
													href={`/profile/${user.username || user.firstName || "user"}`}
													className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
												>
													View Profile
												</Link>
											)}
											<Link
												href="/profile"
												className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
											>
												Edit Profile
											</Link>
										</div>
									</div>

									{/* Theme Switcher */}
									<div className="relative group">
										<ModeToggle />
									</div>

									{/* Settings Dropdown */}
									<div className="relative group">
										<button
											className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
											title="Settings"
										>
											<Cog className="h-6 w-6" />
										</button>
										<div
											className="absolute right-0 mt-2 w-40 bg-white/70 dark:bg-gray-800/70 backdrop-blur-custom rounded-md shadow-lg 
                      opacity-0 group-hover:opacity-100 
                      transition-all duration-300 ease-in-out transform 
                      -translate-y-1 group-hover:translate-y-0"
										>
											<button
												onClick={() => clerk.signOut()}
												className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
											>
												Logout
											</button>
											<button
												onClick={handleDeleteAccount}
												className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
											>
												Delete Account
											</button>
										</div>
									</div>
								</>
							)}

							{!isSignedIn && (
								<>
									<Link
										href="/signin"
										className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
										title="Sign In"
									>
										Sign In
									</Link>
									<Link
										href="/signup"
										className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
										title="Sign Up"
									>
										Sign Up
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			</nav>

			{/* Command Dialog for Search */}
			<CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
				<span className="sr-only">
					<DialogTitle>Search Posts</DialogTitle>
					<DialogDescription>Type to search posts</DialogDescription>
				</span>
				<Command
					className="command-dialog bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl"
					shouldFilter={false}
				>
					<div className="flex items-center px-3 border-b border-gray-200 dark:border-gray-700">
						<CommandInput
							placeholder="Search posts..."
							value={searchQuery}
							onValueChange={(value) => setSearchQuery(value)}
							className="flex-1 h-12 px-3 text-base bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
						/>
					</div>
					<CommandList className="max-h-[300px] overflow-y-auto p-2">
						{isLoading ? (
							<div className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
								Searching...
							</div>
						) : searchResults.length > 0 ? (
							<>
								{searchResults.map((result) => (
									<CommandItem
										key={result._id}
										onSelect={() => {
											router.push(`/posts/${result.slug.current}`);
											setIsCommandOpen(false);
										}}
										className="flex items-center px-4 py-3 space-x-2 text-sm rounded-lg cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-colors"
									>
										<Search className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
										<span className="flex-1 truncate">{result.title}</span>
									</CommandItem>
								))}
							</>
						) : searchQuery.length > 0 ? (
							<div className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
								No results found
							</div>
						) : (
							<div className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
								Type to start searching...
							</div>
						)}
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	);
};

export default Navbar;
