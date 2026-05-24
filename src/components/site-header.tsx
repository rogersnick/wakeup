"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { AlarmClock } from "lucide-react";
import Link from "next/link";
import { HeaderCityStatus } from "@/components/header-city-status";
import { HeaderPhoneStatus } from "@/components/header-phone-status";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { isSignedIn } = useAuth();

  return (
    <header className="border-b-2 border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="RiseCall home"
        >
          <div
            className={[
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-primary border-2 border-[#6d28d9] shadow-[3px_3px_0px_0px_#4c1d95]",
              "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              "group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[5px_5px_0px_0px_#4c1d95]",
            ].join(" ")}
          >
            <AlarmClock className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-sans text-lg font-extrabold tracking-tight text-foreground">
            Rise<span className="text-primary">Call</span>
          </span>
        </Link>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          ) : (
            <>
              <HeaderCityStatus />
              <HeaderPhoneStatus />
              <Link
                href="/dashboard"
                className={[
                  "text-sm font-bold uppercase tracking-wider text-muted-foreground",
                  "transition-colors duration-200 hover:text-primary",
                ].join(" ")}
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
