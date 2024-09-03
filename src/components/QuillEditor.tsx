// src/components/QuillEditor.tsx
"use client"; // Make sure to use 'use client' to make this a client-side component

import dynamic from "next/dynamic";
import React, { useEffect, useState, useRef } from "react";

// Dynamically import react-quill with SSR disabled
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css"; // Import styles for the Quill editor

const QuillEditor: React.FC<{
	onChange: (content: string) => void;
	initialValue?: string;
}> = ({ onChange, initialValue }) => {
	const [content, setContent] = useState(initialValue || "");

	const handleChange = (value: string) => {
		setContent(value);
		onChange(value);
	};

	return (
		<div>
			{typeof window !== "undefined" && (
				<ReactQuill
					theme="snow"
					value={content}
					onChange={handleChange}
					modules={{
						toolbar: [
							["bold", "italic", "underline"],
							[{ list: "ordered" }, { list: "bullet" }],
							["link", "image"],
							[{ header: [1, 2, false] }],
						],
					}}
				/>
			)}
		</div>
	);
};

export default QuillEditor;
