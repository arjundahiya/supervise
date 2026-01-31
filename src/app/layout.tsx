import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import NavbarWrapper from "./components/navbar-wrapper";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const IBMSans = IBM_Plex_Sans({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Supervise",
  description: "A platform for supervisors and pupils to easily organise supervisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${IBMSans.className} antialiased dark`}
      >
        <NavbarWrapper />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
