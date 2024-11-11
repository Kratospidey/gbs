// src/lib/urlFor.ts
import imageUrlBuilder from "@sanity/image-url";
import client from "./sanityClient";

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
	return builder.image(source);
}
