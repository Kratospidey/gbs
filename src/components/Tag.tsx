// components/Tag.tsx
import Link from "next/link";

interface TagProps {
	text: string;
}

export function Tag({ text }: TagProps) {
	return (
		<Link href={`/tag/${text}`}>
			<span
				className="inline-flex items-center px-3 py-1 mr-2 mb-2 text-sm font-medium rounded-full 
                   bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 
                   hover:bg-blue-200 dark:hover:bg-blue-600 cursor-pointer transition-colors"
			>
				#{text}
			</span>
		</Link>
	);
}
