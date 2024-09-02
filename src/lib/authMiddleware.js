import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET; // Your JWT secret key from environment variables

export function authenticate(req) {
	const authHeader = req.headers.get("Authorization");

	if (!authHeader) {
		return new Response(
			JSON.stringify({ error: "Authorization header missing" }),
			{
				status: 401,
			}
		);
	}

	const token = authHeader.split(" ")[1]; // Get the token from the "Bearer <token>" format

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded; // Attach the decoded user information to the request object
		return true; // Authentication successful
	} catch (err) {
		return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
			status: 401,
		});
	}
}
