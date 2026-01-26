"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Removed unused imports
import { LogOut } from "lucide-react";

export default function Navbar() {
    const {
        data: session,
        // isPending, // You can use these if you want loading states
        // error, 
    } = authClient.useSession();

    // Fix: We safely cast user to 'any' to access the custom 'role' property
    const isAdmin = (session?.user as any)?.role === "ADMIN";

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
                        {/* I removed the "Availability" link since we moved that 
                           into the popup on the dashboard, but you can keep it if you want.
                        */}
                        
                        {/* CONDITIONAL RENDERING: Only render the link if user is Admin */}
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
                                    <DropdownMenuItem onClick={() => authClient.signOut()}>
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