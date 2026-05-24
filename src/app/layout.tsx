import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "RiseCall",
  description: "Personal wake-up calls that help you start on time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className={`${outfit.variable} h-full antialiased`}>
        <body className="min-h-full bg-background text-foreground font-sans">
          <SiteHeader />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
