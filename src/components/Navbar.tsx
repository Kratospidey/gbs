// components/Navbar.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Cog, User, LayoutDashboard, Bookmark, Pencil } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useUser, useClerk } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import debounce from "lodash/debounce";

interface SearchResult {
	_id: string;
	title: string;
	slug: {
		current: string;
	};
}

const Navbar: React.FC = () => {
	const { user, isLoaded, isSignedIn } = useUser();
	const clerk = useClerk();
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [showResults, setShowResults] = useState(false);

	// Debounced search function
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.length < 2) {
				setSearchResults([]);
				return;
			}

			const lowerQuery = query.toLowerCase();

			try {
				// Adjusted search patterns using glob wildcards
				const searchTerms = {
					exact: lowerQuery,
					prefix: `${lowerQuery}*`,
					contains: `*${lowerQuery}*`,
					fuzzy: `*${lowerQuery.split("").join("*")}*`,
				};

				const results = await client.fetch<SearchResult[]>(
					`
          *[_type == "post" && title != null] {
            _id,
            title,
            slug,
            "score": select(
              lower(title) == $exact => 4,
              lower(title) match $prefix => 3,
              lower(title) match $contains => 2,
              lower(title) match $fuzzy => 1,
              0
            )
          }[score > 0] | order(score desc, title asc)[0...5]
          `,
					searchTerms
				);

				setSearchResults(results);
			} catch (error) {
				console.error("Search error:", error);
				setSearchResults([]);
			}
		}, 300),
		[]
	);

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);
		debouncedSearch(query);
		setShowResults(true);
	};

	// Close search results when clicking outside
	useEffect(() => {
		const handleClickOutside = () => setShowResults(false);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const username =
		isSignedIn && user ? user.username || user.firstName || "user" : null;

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

	return (
		<nav className="sticky top-0 bg-white dark:bg-gray-800 shadow-md z-50">
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
						{/* Search Bar */}
						<div className="relative" onClick={(e) => e.stopPropagation()}>
							<input
								type="text"
								value={searchQuery}
								onChange={handleSearchChange}
								onFocus={() => setShowResults(true)}
								placeholder="Search posts..."
								className="w-64 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
							/>

							{/* Search Results Dropdown */}
							{showResults && searchResults.length > 0 && (
								<div className="absolute w-full mt-1 bg-white dark:bg-gray-700 border rounded-md shadow-lg max-h-60 overflow-auto">
									{searchResults.map((result) => (
										<Link
											key={result._id}
											href={`/posts/${result.slug.current}`}
											className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white"
											onClick={() => {
												setShowResults(false);
												setSearchQuery("");
											}}
										>
											{result.title}
										</Link>
									))}
								</div>
							)}
						</div>

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
										className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg 
											invisible group-hover:visible opacity-0 group-hover:opacity-100 
											transition-all duration-300 ease-in-out transform 
											-translate-y-1 group-hover:translate-y-0
											group-hover:delay-100
											before:content-[''] before:absolute before:top-[-10px] before:left-0 before:w-full before:h-[10px]"
									>
										{username && (
											<Link
												href={`/profile/${username}`}
												className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
											>
												View Profile
											</Link>
										)}
										<Link
											href="/profile"
											className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
										>
											Edit Profile
										</Link>
									</div>
								</div>

								{/* Theme Switcher */}
								<div className="relative group">
									<ModeToggle />
								</div>

								{/* Cog Icon Dropdown */}
								<div className="relative group">
									<button
										className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
										title="Settings"
									>
										<Cog className="h-6 w-6" />
									</button>
									<div
										className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-md shadow-lg 
											invisible group-hover:visible opacity-0 group-hover:opacity-100 
											transition-all duration-300 ease-in-out transform 
											-translate-y-1 group-hover:translate-y-0
											group-hover:delay-100
											before:content-[''] before:absolute before:top-[-10px] before:left-0 before:w-full before:h-[10px]"
									>
										<button
											onClick={() => clerk.signOut()}
											className="w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
										>
											Logout
										</button>
										<button
											onClick={handleDeleteAccount}
											className="w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
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
	);
};

export default Navbar;
