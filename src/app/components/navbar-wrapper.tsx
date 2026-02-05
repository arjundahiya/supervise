import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSwapRequestsForUser } from "@/app/actions/swap-requests";
import { unstable_cache } from "next/cache";
import Navbar from "./navbar";

// Define cache tag constant for revalidation
export const SWAP_REQUESTS_CACHE_TAG = 'swap-requests';

// Cache swap requests with user-specific key and global tag
const getCachedSwapRequests = unstable_cache(
  async (userId: string) => getSwapRequestsForUser(userId),
  ['user-swap-requests'], // Cache key prefix
  { 
    tags: [SWAP_REQUESTS_CACHE_TAG], // Tag for revalidation
    revalidate: 300 // Cache for 5 minutes
  }
);

export default async function NavbarWrapper() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  let swapRequests: any[] = [];
  if (session?.user?.id) {
    swapRequests = await getCachedSwapRequests(session.user.id);
  }
  
  return <Navbar session={session} swapRequests={swapRequests} />;
}