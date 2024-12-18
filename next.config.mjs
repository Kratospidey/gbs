/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: [
			"rtxdprgjzkuygzjvqmac.supabase.co",
			"cdn.sanity.io",
			"static.vecteezy.com",
			"api.microlink.io",
			"img.clerk.com", // Correctly quoted
		],
	},
	// Add other Next.js configurations here if needed
};

export default nextConfig;
