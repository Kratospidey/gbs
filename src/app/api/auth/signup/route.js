import bcrypt from "bcrypt";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
	try {
		const { username, email, password } = await req.json();

		
		const hashedPassword = await bcrypt.hash(password, 10);

		const { data, error } = await supabase
			.from("user")
			.insert([{ username, email, password: hashedPassword }]);

		if (error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 400,
			});
		}

		return new Response(JSON.stringify({ data }), { status: 200 });
	} catch (err) {
		return new Response(JSON.stringify({ error: "Server error" }), {
			status: 500,
		});
	}
}
