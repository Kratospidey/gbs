// components/Navbar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cog, User, LayoutDashboard, Bookmark } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useUser, useClerk } from "@clerk/nextjs";

const Navbar: React.FC = () => {
	const { user, isLoaded, isSignedIn } = useUser();
	const clerk = useClerk();
	const [isCogOpen, setIsCogOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);

	const toggleCog = () => setIsCogOpen(!isCogOpen);
	const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

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
						<input
							type="text"
							placeholder="Search..."
							className="hidden md:block px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
							disabled
						/>

						{isSignedIn && (
							<>
								{/* Saved Posts */}
								<Link
									href="/saved"
									className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
								>
									<Bookmark className="h-6 w-6" />
								</Link>

								{/* Dashboard */}
								<Link
									href="/dashboard"
									className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
								>
									<LayoutDashboard className="h-6 w-6" />
								</Link>

								{/* Profile Dropdown */}
								<div className="relative">
									<button
										onClick={toggleProfile}
										className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
									>
										<User className="h-6 w-6" />
									</button>
									{isProfileOpen && (
										<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-2">
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
									)}
								</div>

								{/* Theme Switcher */}
								<ModeToggle />

								{/* Cog Icon Dropdown */}
								<div className="relative">
									<button
										onClick={toggleCog}
										className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
									>
										<Cog className="h-6 w-6" />
									</button>
									{isCogOpen && (
										<div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-md shadow-lg py-2">
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
									)}
								</div>
							</>
						)}

						{!isSignedIn && (
							<>
								<Link
									href="/signin"
									className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
								>
									Sign In
								</Link>
								<Link
									href="/signup"
									className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
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
