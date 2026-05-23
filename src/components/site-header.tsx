"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export function SiteHeader() {
  const { isSignedIn } = useAuth();

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Wake Up Call
        </Link>
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                Sign in
              </button>
            </SignInButton>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
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
