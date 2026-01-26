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
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export default function Navbar() {
    const {
        data: session,
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession()
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
                        <Link href="/availability" className="text-muted-foreground hover:text-foreground">
                            Availability
                        </Link>
                        <Link hidden={session?.user.role !== "ADMIN"} href="/admin" className="text-muted-foreground hover:text-foreground">
                            Admin
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm">Help</Button>
                    {session ?
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarFallback>{session?.user.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
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
                                        <LogOut className="text-red-700" />Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        : <Button onClick={() => authClient.signIn.oauth2({
                            providerId: "raven",
                            scopes: ["openid", "email", "profile"]
                        })}>Sign In</Button>}
                </div>
            </div>
        </header>
    )
}