// components/Tag.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import Link from "next/link";

interface TagProps {
  text: string;
  isEditable?: boolean;
  onClick?: () => void;
}

export const Tag: React.FC<TagProps> = ({ text, isEditable, onClick }) => {
  const TagContent = (
    <Badge
      variant="secondary"
      className={`flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 ${
        !isEditable ? 'cursor-pointer' : ''
      }`}
    >
      {text}
      {isEditable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onClick?.();
          }}
          className="ml-1 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );

  return isEditable ? (
    TagContent
  ) : (
    <Link href={`/tag/${text.toLowerCase()}`}>
      {TagContent}
    </Link>
  );
};
