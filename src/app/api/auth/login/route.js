import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcrypt";

export async function POST(req) {
	try {
		const { email, password } = await req.json();

		// Fetch the user from the database
		const { data: user, error } = await supabase
			.from("user")
			.select("*")
			.eq("email", email)
			.single();

		if (error) {
			return new Response(JSON.stringify({ error: "Invalid credentials" }), {
				status: 400,
			});
		}

		// Compare the provided password with the hashed password in the database
		const match = await bcrypt.compare(password, user.password);

		if (!match) {
			return new Response(JSON.stringify({ error: "Invalid credentials" }), {
				status: 400,
			});
		}

		return new Response(
			JSON.stringify({
				message: "Login successful",
				user: { id: user.id, username: user.username },
			}),
			{ status: 200 }
		);
	} catch (err) {
		return new Response(JSON.stringify({ error: "Server error" }), {
			status: 500,
		});
	}
}
