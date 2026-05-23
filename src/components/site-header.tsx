"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { isSignedIn } = useAuth();

  return (
    <header className="bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight transition-colors duration-200 hover:text-primary"
        >
          Wake Up Call
        </Link>
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold uppercase tracking-wider text-gray-600 transition-colors duration-200 hover:text-primary"
              >
                Dashboard
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
