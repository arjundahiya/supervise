"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation"; // <--- 1. Import this
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export default function Navbar() {
    const router = useRouter(); // <--- 2. Initialize the router
    
    const {
        data: session,
    } = authClient.useSession();

    const isAdmin = (session?.user as any)?.role === "ADMIN";

    // <--- 3. Create a handleLogout function
    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/"); // Redirect to login page
                    router.refresh();        // Clear any cached data
                },
            },
        });
    };

    return (
        <header className="border-b">
            <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
                        Supervise
                    </Link>

                    <nav className="hidden md:flex items-center gap-4 text-sm">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                            Dashboard
                        </Link>
                        {isAdmin && (
                            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                                Admin
                            </Link>
                        )}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm">Help</Button>
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarFallback>
                                        {session?.user.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
                                    <DropdownMenuItem>Profile</DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    {/* 4. Update the onClick handler */}
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4 text-red-700" />
                                        <span>Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={() => authClient.signIn.oauth2({
                            providerId: "raven",
                            scopes: ["openid", "email", "profile"]
                        })}>Sign In</Button>
                    )}
                </div>
            </div>
        </header>
    );
}