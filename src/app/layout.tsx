import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "./components/navbar";
import { SpeedInsights } from "@vercel/speed-insights/next"

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
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
