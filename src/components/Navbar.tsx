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
} from "@tabler/icons-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { ModeToggle } from "@/components/mode-toggle"; // Import ModeToggle
import { useRouter } from "next/navigation";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Post } from "@/components/types/post";

const Navbar: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandInputValue, setCommandInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

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

  const items = [
    {
      title: "Home",
      icon: <IconHome />,
      href: "/",
    },
    {
      title: "Search",
      icon: <IconSearch />,
      onClick: () => setIsCommandOpen(true),
    },
    ...(isSignedIn
      ? [
          {
            title: "Saved",
            icon: <IconBookmark />,
            href: "/saved",
          },
          {
            title: "Dashboard",
            icon: <IconLayoutDashboard />,
            href: "/dashboard",
          },
          {
            title: "Create Post",
            icon: <IconPencil />,
            href: "/posts/create",
          },
          {
            title: "Profile",
            icon: <IconUser />,
            submenu: [
              {
                title: "View Profile",
                href: `/profile/${user?.id}`,
                icon: <IconEye />,
              },
              {
                title: "Edit Profile",
                href: "/profile/edit",
                icon: <IconEdit />,
              },
            ],
          },
          {
            title: "Settings",
            icon: <IconSettings />,
            submenu: [
              {
                title: "Logout",
                onClick: handleLogout,
                icon: <IconLogout />,
              },
              {
                title: "Delete Account",
                onClick: handleDeleteAccount,
                icon: <IconTrash />,
              },
            ],
          },
        ]
      : [
          {
            title: "Sign In",
            icon: <IconUser />,
            href: "/signin",
          },
        ]),
    // Use ModeToggle directly as the icon
    {
      title: "Theme",
      icon: <ModeToggle />,
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
