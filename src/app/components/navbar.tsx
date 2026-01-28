"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard, ShieldCheck, HelpCircle, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    
    const { data: session } = authClient.useSession();
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                    router.refresh();
                },
            },
        });
    };

    // Helper for active link styling
    const isActive = (path: string) => pathname === path;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
                
                {/* Left: Brand & Nav */}
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold group-hover:rotate-3 transition-transform">
                            S
                        </div>
                        <span className="text-xl font-bold tracking-tight hidden sm:block">
                            Supervise
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink href="/dashboard" active={isActive("/dashboard")}>
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </NavLink>
                        {isAdmin && (
                            <NavLink href="/admin" active={isActive("/admin")}>
                                <ShieldCheck className="w-4 h-4" />
                                Admin
                            </NavLink>
                        )}
                    </nav>
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Visual Search Trigger (for future Cmd+K) */}
                    <button className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md bg-muted/50 hover:bg-muted transition-colors">
                        <Search className="w-4 h-4" />
                        <span>Search...</span>
                        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </button>

                    <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                    </Button>

                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-9 w-9 cursor-pointer ring-offset-2 ring-primary transition-all hover:ring-2">
                                    <AvatarImage src={session?.user.image || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                        {session?.user.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground italic">
                                            {isAdmin ? "Administrator" : "Student"}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                                    <DropdownMenuItem>Notification Preferences</DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button size="sm" onClick={() => authClient.signIn.oauth2({ providerId: "raven" })}>
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}

// Sub-component for cleaner code
function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
    return (
        <Link 
            href={href} 
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            {children}
        </Link>
    );
}