import { Show, SignInButton } from "@clerk/nextjs";
import { AlarmClock, Mic, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { IconCircle } from "@/components/ui/icon-circle";

const features = [
  {
    title: "Verify phone",
    body: "SMS OTP before anything is scheduled.",
    icon: Phone,
    variant: "primary" as const,
    iconClassName: "text-primary",
  },
  {
    title: "Generate audio",
    body: "ElevenLabs turns your script into an MP3.",
    icon: Mic,
    variant: "secondary" as const,
    iconClassName: "text-secondary",
  },
  {
    title: "Call on time",
    body: "Cron + Twilio dial you when nextAttemptAt hits.",
    icon: AlarmClock,
    variant: "accent" as const,
    iconClassName: "text-accent",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary px-6 py-20 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-8 h-64 w-64 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-12 h-48 w-48 rotate-12 bg-white/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 top-1/2 h-32 w-32 rounded-full bg-white/5"
        />

        <div className="relative mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-100">
            V0
          </p>
          <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Wake up to a call that knows your name.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            Verify your phone, write your message, and get an ElevenLabs voice call
            at the time you choose. Press 1 to confirm you&apos;re awake.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-blue-50 hover:text-blue-700"
                >
                  Get started
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-blue-50 hover:text-blue-700"
                >
                  Open dashboard
                </Button>
              </Link>
            </Show>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            Three flat steps from setup to your morning call.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {features.map(({ title, body, icon, variant, iconClassName }) => (
              <Card key={title} variant={variant} interactive className="p-8">
                <IconCircle icon={icon} iconClassName={iconClassName} />
                <CardTitle className="mt-6">{title}</CardTitle>
                <CardDescription>{body}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-900 px-6 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
          {[
            { value: "1 min", label: "Setup time", color: "text-primary" },
            { value: "500", label: "Max script chars", color: "text-secondary" },
            { value: "Press 1", label: "To confirm awake", color: "text-accent" },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <p className={`text-4xl font-extrabold tracking-tight ${color}`}>
                {value}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent px-6 py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Ready to stop snoozing?
            </h2>
            <p className="mt-3 max-w-xl text-lg text-amber-950/80">
              Schedule your first wake-up call in under a minute.
            </p>
          </div>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                Get started free
              </Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                Go to dashboard
              </Button>
            </Link>
          </Show>
        </div>
      </section>
    </main>
  );
}
