// src/lib/imageUrlBuilder.ts
import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const sanityClient = createClient({
	projectId: "xclui0cs", // Replace with your actual project ID
	dataset: "production", // Replace with your dataset
	useCdn: true, // Use CDN for faster response
	apiVersion: "2023-10-16", // Use a date string in the format YYYY-MM-DD
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
	return builder.image(source);
}
