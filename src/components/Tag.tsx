// components/Tag.tsx
"use client";

import { useRouter } from "next/navigation"; // Use next/navigation instead of next/router
import React from "react";

interface TagProps {
	text: string;
	onClick?: () => void;
	isEditable?: boolean;
}

export const Tag: React.FC<TagProps> = ({
	text,
	onClick,
	isEditable = false,
}) => {
	const router = useRouter();

	const handleClick = () => {
		if (isEditable && onClick) {
			onClick();
		} else {
			router.push(`/tag/${text}`);
		}
	};

	return (
		<span
			className={`bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm mr-2 mb-2 
        ${isEditable ? "cursor-pointer hover:bg-red-100" : "cursor-pointer hover:bg-blue-200"}`}
			onClick={handleClick}
		>
			{text} {isEditable && "×"}
		</span>
	);
};
