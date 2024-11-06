// src/app/404/page.tsx
"use client";

import Link from "next/link";

const NotFoundPage = () => {
return (
	<div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
		<h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
			404 - Page Not Found
		</h1>
		<p className="mt-4 text-gray-600 dark:text-gray-400">
			The page you are looking for does not exist.
		</p>
		<Link href="/" className="mt-6 text-blue-600 hover:underline">
			Go back to Home
		</Link>
	</div>
);
};

export default NotFoundPage;
