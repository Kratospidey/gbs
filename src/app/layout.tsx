// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Providers } from "./Providers";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";

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
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta property="og:title" content="Babel" />
				<meta property="og:description" content="Blogging Platform" />
				<meta
					property="og:image"
					content="https://opengraph.githubassets.com/21b294e69066486315ba191aa24d0493ab6a074c423a36ba5411b5fd410ea30c/Kratospidey/gbs"
				/>
				<link rel="icon" href="/babel.svg" type="image/x-icon" />
			</head>
			<body suppressHydrationWarning>
				<Providers>
					<div className={inter.className}>
						<Navbar />
						<div id="dropdown-root" />
						<RootLayoutClient>{children}</RootLayoutClient>
					</div>
				</Providers>
			</body>
		</html>
	);
}
