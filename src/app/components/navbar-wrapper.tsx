import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSwapRequestsForUser } from "@/app/actions/swap-requests";
import Navbar from "./navbar";

export default async function NavbarWrapper() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  let swapRequests: any[] = [];
  if (session?.user?.id) {
    swapRequests = await getSwapRequestsForUser(session.user.id);
  }
  
  return <Navbar session={session} swapRequests={swapRequests} />;
}