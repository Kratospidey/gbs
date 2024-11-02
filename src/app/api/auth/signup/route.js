// api/auth/signup/route.js

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // Import JWT
import { supabase } from "@/lib/supabaseClient";

const JWT_SECRET = process.env.JWT_SECRET; // Your JWT secret key from environment variables

export async function POST(req) {
	try {
		const { username, email, password } = await req.json();

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Save the user in the Supabase database and request returning data
		const { data, error } = await supabase
			.from("user")
			.insert([{ username, email, password: hashedPassword }])
			.select("*"); // Explicitly select all columns

		// Handle errors from Supabase
		if (error) {
			if (
				error.message.includes("duplicate key value violates unique constraint")
			) {
				return new Response(
					JSON.stringify({ error: "Username already taken" }),
					{
						status: 400,
					}
				);
			}

			console.error("Supabase error:", error.message); // Log specific Supabase error
			return new Response(JSON.stringify({ error: error.message }), {
				status: 400,
			});
		}

		if (!data || data.length === 0) {
			return new Response(JSON.stringify({ error: "Failed to create user" }), {
				status: 500,
			});
		}

		// Create JWT token
		const token = jwt.sign({ id: data[0].id, email }, JWT_SECRET, {
			expiresIn: "1h", // Token expiration
		});

		// Set the JWT token in an HTTP-only cookie
		const response = new Response(
			JSON.stringify({ message: "Signup successful" }),
			{
				status: 200,
			}
		);

		response.headers.set(
			"Set-Cookie",
			`token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`
		);

		return response;
	} catch (err) {
		console.error("Server error:", err); // Log the specific server error
		return new Response(JSON.stringify({ error: "Server error" }), {
			status: 500,
		});
	}
}
