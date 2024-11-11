// src/app/layout.tsx
import type { Metadata } from "next";
import RootLayoutClient from "./RootLayoutClient";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Babel",
	description: "Blogging Platform",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				{/* Basic Meta Tags */}
				<meta property="og:title" content="Babel" />
				<meta property="og:description" content="Blogging Platform" />
				<meta
					property="og:image"
					content="https://opengraph.githubassets.com/21b294e69066486315ba191aa24d0493ab6a074c423a36ba5411b5fd410ea30c/Kratospidey/gbs"
				/>

				{/* WhatsApp specific */}
				<meta property="og:image:width" content="1200" />
				<meta property="og:image:height" content="630" />

				{/* Discord specific */}
				<meta name="twitter:card" content="Babel" />
				<meta
					name="twitter:image"
					content="https://opengraph.githubassets.com/21b294e69066486315ba191aa24d0493ab6a074c423a36ba5411b5fd410ea30c/Kratospidey/gbs"
				/>

				<link rel="icon" href="/babel.svg" type="image/x-icon"></link>
			</head>
			<body className={inter.className}>
				<RootLayoutClient>
					<Navbar />
					<div id="dropdown-root"></div> {/* Add this div for the dropdown */}
					<div>
						{/* Your main content */}
						{children}
					</div>
				</RootLayoutClient>
			</body>
		</html>
	);
}
