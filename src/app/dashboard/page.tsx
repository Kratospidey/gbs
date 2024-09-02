"use client";

import React from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

const Dashboard: React.FC = () => {
	// Get the user object from Clerk
	const { user } = useUser();

	// Check if user data is available and extract the username
	const username = user?.username || user?.firstName || "User";

	return (
		<div
			style={{
				maxWidth: "400px",
				margin: "100px auto",
				padding: "20px",
				border: "1px solid #ccc",
				borderRadius: "4px",
				textAlign: "center",
			}}
		>
			<h1>Hello, {username}!</h1>
		</div>
	);
};

// Protect the dashboard page to be only accessible by signed-in users
const ProtectedDashboard: React.FC = () => {
	return (
		<>
			{/* Content for signed-in users */}
			<SignedIn>
				<Dashboard />
			</SignedIn>
			{/* Redirect to sign-in page if not signed-in */}
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
		</>
	);
};

export default ProtectedDashboard;
