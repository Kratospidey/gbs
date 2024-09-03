import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const client = createClient({
  projectId: 'xclui0cs',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-03-07', // use a UTC date string
  token: process.env.NEXT_PUBLIC_SANITY_API_TOKEN, // Ensure the token is set and has the right permissions
});

export const urlFor = (source: any) => imageUrlBuilder(client).image(source);

export default client;
