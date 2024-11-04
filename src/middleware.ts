import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import client from "@/lib/sanityClient";

const isPublicRoute = createRouteMatcher(['/sign-in', '/sign-up', '/studio']);

async function syncUserWithSanity(userId: string, userData: any) {
  console.log('Syncing user:', { userId, userData }); // Debug log

  // First try to find by clerk_id
  let existingAuthor = await client.fetch(
    `*[_type == "author" && clerk_id == $clerk_id][0]`,
    { clerk_id: userId }
  );

  // If not found, try to find by name (for migration)
  if (!existingAuthor) {
    existingAuthor = await client.fetch(
      `*[_type == "author" && name == $name][0]`,
      { name: "kratospidey" } // Your original author name
    );
  }

  if (existingAuthor) {
    console.log('Updating existing author:', existingAuthor._id);
    await client
      .patch(existingAuthor._id)
      .set({
        clerk_id: userId, // Update clerk_id for existing author
        name: existingAuthor.name, // Preserve existing name
      })
      .commit();
  } else {
    console.log('Creating new author');
    await client.create({
      _type: 'author',
      name: userData.username || 'Anonymous',
      clerk_id: userId,
      slug: {
        _type: 'slug',
        current: userData.username?.toLowerCase() || userId
      }
    });
  }
}

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId, sessionClaims } = auth();
    
    if (userId) {
      try {
        await syncUserWithSanity(userId, sessionClaims || {});
      } catch (error) {
        console.error('Failed to sync user with Sanity:', error);
      }
    }
    
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
