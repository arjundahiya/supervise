"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldCheck, LogIn } from "lucide-react"; // Optional: lucide-react for icons

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Using useEffect for redirection is often cleaner to avoid 
  // "render while redirecting" conflicts in some Next.js versions
  useEffect(() => {
    if (session && !isPending) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-2xl border p-10 shadow-sm m-5">
        
        {/* Logo/Brand Section */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Supervise
          </h1>
          <p className="mt-2 text-sm">
            Please sign in to access your dashboard
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => authClient.signIn.oauth2({
              providerId: "raven",
              scopes: ["openid", "email", "profile"],
            })}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg px-4 text-sm font-medium transition-all active:scale-[0.98] hover:backdrop-invert-10 border-2"
          >
            <LogIn size={18} />
            Sign in with Raven
          </button>
        </div>
      </div>
    </div>
  );
}