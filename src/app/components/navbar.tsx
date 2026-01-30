"use client";

import { useState } from "react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, LayoutDashboard, ShieldCheck, Bell, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "./notifications-popover";

interface NavbarProps {
    session: any;
    swapRequests: any[];
}

export default function Navbar({ session, swapRequests }: NavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
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

    const navLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">

                {/* Mobile Menu Button */}
                <div className="flex md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-2">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-70 sm:w-87.5">
                            <SheetHeader className="text-left">
                                <SheetTitle className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">S</div>
                                    Supervise
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-2 mt-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                            pathname === link.href
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <link.icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Brand Logo */}
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold group-hover:rotate-3 transition-transform">
                            S
                        </div>
                        <span className="text-xl font-bold tracking-tight hidden sm:block">
                            Supervise
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    pathname === link.href
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right Side Icons */}
                <div className="flex items-center gap-2">
                    {session?.user?.id && (
                        <NotificationsPopover
                            swapRequests={swapRequests}
                            userId={session.user.id}
                        />
                    )}
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-9 w-9 cursor-pointer ring-offset-2 ring-primary transition-all hover:ring-2">
                                    <AvatarImage src={session?.user.image || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                        {session?.user.name.split(" ").map((n: string) => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{session.user.name}</p>
                                        <p className="text-xs text-muted-foreground italic">
                                            {isAdmin ? "Administrator" : "Student"}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button size="sm" onClick={() => authClient.signIn.oauth2({
                            providerId: "raven",
                            scopes: ["openid", "email", "profile"],
                        })}>
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}