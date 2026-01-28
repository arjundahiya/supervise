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
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        
        {/* Logo/Brand Section */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white dark:bg-zinc-100 dark:text-black">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Supervise
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Please sign in to access your dashboard
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => authClient.signIn.oauth2({
              providerId: "raven",
              scopes: ["openid", "email", "profile"],
            })}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <LogIn size={18} />
            Sign in with Raven
          </button>
        </div>
      </div>
    </div>
  );
}