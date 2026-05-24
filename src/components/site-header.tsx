"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { PhoneCall } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderCityStatus } from "@/components/header-city-status";
import { HeaderPhoneStatus } from "@/components/header-phone-status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Schedule" },
  { href: "/dashboard/wakeups", label: "Wake-ups" },
];

export function SiteHeader() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b-4 border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline-3 focus-visible:outline-offset-3"
          aria-label="AlarmCall home"
        >
          <div className="flex h-10 w-10 items-center justify-center bg-background text-foreground">
            <PhoneCall className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
            AlarmCall
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
              <nav className="flex items-center gap-4">
                {navLinks.map(({ href, label }) => {
                  const active =
                    href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "border-b-2 border-transparent font-mono text-xs font-medium uppercase tracking-widest transition-colors duration-100 focus-visible:border-foreground focus-visible:outline-none",
                        active
                          ? "border-foreground text-foreground"
                          : "text-muted-foreground hover:border-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <UserButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
