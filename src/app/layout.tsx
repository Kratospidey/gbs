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
			<link rel="icon" href="/babel.svg" type="image/x-icon"></link>
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
