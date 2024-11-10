// src/components/Navbar.tsx
"use client";

import { FloatingDock } from "@/components/ui/floating-dock";
import { useUser, useClerk } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import {
	IconHome,
	IconSearch,
	IconBookmark,
	IconLayoutDashboard,
	IconPencil,
	IconUser,
	IconSettings,
	IconEye,
	IconEdit,
	IconLogout,
	IconTrash,
	IconSun,
	IconMoon,
} from "@tabler/icons-react";
import {
	CommandDialog,
	CommandInput,
	CommandList,
	CommandItem,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Post } from "@/components/types/post";
import { useTheme } from "next-themes"; // Import useTheme

interface DockItem {
	title: string;
	icon?: React.ReactNode;
	href?: string;
	onClick?: () => void;
	submenu?: Omit<DockItem, "submenu">[];
}

const Navbar: React.FC = () => {
	const { user, isSignedIn } = useUser();
	const clerk = useClerk();
	const router = useRouter();
	const [isCommandOpen, setIsCommandOpen] = useState(false);
	const [commandInputValue, setCommandInputValue] = useState("");
	const [searchResults, setSearchResults] = useState<Post[]>([]);
	const [isLoadingSearch, setIsLoadingSearch] = useState(false);

	const { setTheme, theme, resolvedTheme } = useTheme();
	const currentTheme = (theme === "system" ? resolvedTheme : theme) ?? "light";

	const toggleTheme = () => {
		const nextTheme = currentTheme === "light" ? "dark" : "light";
		setTheme(nextTheme);
	};

	const handleLogout = () => {
		clerk.signOut();
	};

	const handleDeleteAccount = async () => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete your account?"
		);
		if (!confirmDelete) return;

		try {
			await fetch("/api/deleteAccount", {
				method: "DELETE",
			});
			await clerk.signOut();
			alert("Account deleted successfully.");
			router.push("/");
		} catch (error) {
			console.error("Delete account error:", error);
			alert("Failed to delete account.");
		}
	};

	const items: DockItem[] = [
		{
			title: "Home",
			icon: <IconHome className="h-6 w-6" />,
			href: "/",
		},
		{
			title: "Search",
			icon: <IconSearch className="h-6 w-6" />,
			onClick: () => setIsCommandOpen(true),
		},
		...(isSignedIn
			? [
					{
						title: "Saved",
						icon: <IconBookmark className="h-6 w-6" />,
						href: "/saved",
					},
					{
						title: "Dashboard",
						icon: <IconLayoutDashboard className="h-6 w-6" />,
						href: "/dashboard",
					},
					{
						title: "Create Post",
						icon: <IconPencil className="h-6 w-6" />,
						href: "/posts/create",
					},
					{
						title: "Profile",
						icon: <IconUser className="h-6 w-6" />,
						submenu: [
							{
								title: "View Profile",
								href: `/profile/${user?.username}`,
								icon: <IconEye className="h-5 w-5" />,
							},
							{
								title: "Edit Profile",
								href: "/profile/edit",
								icon: <IconEdit className="h-5 w-5" />,
							},
						],
					},
					{
						title: "Settings",
						icon: <IconSettings className="h-6 w-6" />,
						submenu: [
							{
								title: "Logout",
								onClick: handleLogout,
								icon: <IconLogout className="h-5 w-5" />,
							},
							{
								title: "Delete Account",
								onClick: handleDeleteAccount,
								icon: <IconTrash className="h-5 w-5" />,
							},
						],
					},
				]
			: [
					{
						title: "Sign In",
						icon: <IconUser className="h-6 w-6" />,
						href: "/signin",
					},
				]),
		// Theme Toggle Item
		{
			title: "Toggle Theme",
			icon:
				currentTheme === "dark" ? (
					<IconSun className="h-6 w-6" />
				) : (
					<IconMoon className="h-6 w-6" />
				),
			onClick: toggleTheme,
		},
	];

	// Fetch posts when the command dialog opens
	useEffect(() => {
		if (isCommandOpen) {
			setIsLoadingSearch(true);
			fetch("/api/posts?status=published")
				.then((res) => res.json())
				.then((data) => {
					setSearchResults(data.posts || []);
					setIsLoadingSearch(false);
				})
				.catch((error) => {
					console.error("Error fetching posts for search:", error);
					setIsLoadingSearch(false);
				});
		}
	}, [isCommandOpen]);

	// Filter posts based on input
	const filteredResults = searchResults.filter((post) =>
		post.title.toLowerCase().includes(commandInputValue.toLowerCase())
	);

	return (
		<>
			<FloatingDock
				items={items}
				desktopClassName="fixed bottom-4 left-1/2 transform -translate-x-1/2"
				mobileClassName="fixed bottom-4 right-4"
			/>
			<CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
				<VisuallyHidden>
					<DialogTitle>Search</DialogTitle>
				</VisuallyHidden>
				<CommandInput
					placeholder="Search posts..."
					value={commandInputValue}
					onValueChange={setCommandInputValue}
				/>
				<CommandList>
					{isLoadingSearch ? (
						<CommandItem disabled>Loading...</CommandItem>
					) : filteredResults.length > 0 ? (
						filteredResults.map((post) => (
							<CommandItem
								key={post._id}
								onSelect={() => router.push(`/posts/${post.slug}`)}
							>
								{post.title}
							</CommandItem>
						))
					) : (
						<CommandItem disabled>No results found.</CommandItem>
					)}
				</CommandList>
			</CommandDialog>
		</>
	);
};

export default Navbar;
