"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState(null);
	const router = useRouter(); // Initialize the router

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error);
			}

			// Redirect to the dashboard with the username in query parameters
			router.push(`/dashboard?username=${data.user.username}`);
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div
			style={{
				maxWidth: "400px",
				margin: "100px auto",
				padding: "20px",
				border: "1px solid #ccc",
				borderRadius: "4px",
			}}
		>
			<h2>Login</h2>
			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: "10px" }}>
					<label htmlFor="email">Email:</label>
					<input
						type="email"
						id="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						required
						style={{ width: "100%", padding: "8px", marginTop: "5px" }}
					/>
				</div>
				<div style={{ marginBottom: "10px" }}>
					<label htmlFor="password">Password:</label>
					<input
						type="password"
						id="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
						required
						style={{
							width: "100%",
							padding: "8px",
							marginTop: "5px",
							color: "black",
						}}
					/>
				</div>
				{error && <p style={{ color: "red" }}>{error}</p>}
				<button
					type="submit"
					style={{
						padding: "10px 15px",
						backgroundColor: "#0070f3",
						color: "#fff",
						border: "none",
						borderRadius: "4px",
					}}
				>
					Login
				</button>
			</form>
		</div>
	);
}
