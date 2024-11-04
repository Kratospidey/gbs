// components/Tag.tsx
interface TagProps {
	text: string;
	onClick?: () => void;
}

export function Tag({ text, onClick }: TagProps) {
	return (
		<span
			onClick={onClick}
			className="inline-flex items-center px-3 py-1 mr-2 mb-2 text-sm font-medium rounded-full 
        bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
        hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
		>
			#{text}
		</span>
	);
}
