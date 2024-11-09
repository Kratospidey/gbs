// components/Navbar.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Cog, User, LayoutDashboard, Bookmark, Pencil } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useUser, useClerk } from "@clerk/nextjs";
import client from "@/lib/sanityClient";
import debounce from "lodash/debounce";
import { createPortal } from "react-dom";

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
	const [scrolled, setScrolled] = useState(false);

	const searchInputRef = useRef<HTMLInputElement>(null);
	const [dropdownPosition, setDropdownPosition] = useState({
		top: 0,
		left: 0,
		width: 0,
	});

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
		const handleClickOutside = (event: MouseEvent) => {
			if (
				searchInputRef.current &&
				!searchInputRef.current.contains(event.target as Node)
			) {
				setShowResults(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Handle scroll to make navbar transparent and blurred
	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 0);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Update dropdown position
	useEffect(() => {
		const updateDropdownPosition = () => {
			if (searchInputRef.current) {
				const rect = searchInputRef.current.getBoundingClientRect();
				setDropdownPosition({
					top: rect.bottom + window.scrollY,
					left: rect.left + window.scrollX,
					width: rect.width,
				});
			}
		};

		if (showResults) {
			updateDropdownPosition();
			window.addEventListener("scroll", updateDropdownPosition);
			window.addEventListener("resize", updateDropdownPosition);
		}

		return () => {
			window.removeEventListener("scroll", updateDropdownPosition);
			window.removeEventListener("resize", updateDropdownPosition);
		};
	}, [showResults]);

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
		<>
			<nav
				className={`fixed top-0 w-full z-50 transition-colors duration-300 backdrop-blur-md ${
					scrolled
						? "bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700"
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
							{/* Search Bar */}
							<div className="relative" onClick={(e) => e.stopPropagation()}>
								<input
									ref={searchInputRef}
									type="text"
									value={searchQuery}
									onChange={handleSearchChange}
									onFocus={() => setShowResults(true)}
									placeholder="Search posts..."
									className="w-full sm:w-64 px-3 py-2 bg-white/70 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 backdrop-blur-md"
								/>
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
											className="absolute right-0 mt-2 w-48 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-md shadow-lg 
                        opacity-0 group-hover:opacity-100 
                        transition-all duration-300 ease-in-out transform 
                        -translate-y-1 group-hover:translate-y-0"
										>
											{username && (
												<Link
													href={`/profile/${username}`}
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
											className="absolute right-0 mt-2 w-40 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-md shadow-lg 
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

			{/* Render the dropdown using a portal */}
			{showResults &&
				searchResults.length > 0 &&
				typeof window !== "undefined" &&
				createPortal(
					<div
						className="absolute z-50 max-h-60 overflow-auto rounded-md
              bg-white/80 dark:bg-gray-800/80 backdrop-blur-md
              border border-gray-300 dark:border-gray-600
              shadow-lg"
						style={{
							top: dropdownPosition.top,
							left: dropdownPosition.left,
							width: dropdownPosition.width,
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{searchResults.map((result) => (
							<Link
								key={result._id}
								href={`/posts/${result.slug.current}`}
								className="block px-4 py-2 text-gray-800 dark:text-gray-200 
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
								onClick={() => {
									setShowResults(false);
									setSearchQuery("");
								}}
							>
								{result.title}
							</Link>
						))}
					</div>,
					document.body
				)}
		</>
	);
};

export default Navbar;
