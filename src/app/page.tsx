import { Show, SignInButton } from "@clerk/nextjs";
import { AlarmClock, ArrowRight, Mic, Phone, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconCircle } from "@/components/ui/icon-circle";

/* ─── Feature cards ─────────────────────────────────────────────────── */
const features = [
  {
    step: "01",
    title: "Verify your phone",
    body: "Quick SMS one-time-password confirms it's really yours before anything gets scheduled.",
    icon: Phone,
    variant: "primary" as const,
    shadowColor: "#4c1d95",
    borderColor: "border-primary",
  },
  {
    step: "02",
    title: "Write your script",
    body: "Give ElevenLabs a message—or get a weather-aware morning brief for your city.",
    icon: Mic,
    variant: "secondary" as const,
    shadowColor: "#9d174d",
    borderColor: "border-secondary",
  },
  {
    step: "03",
    title: "Get called on time",
    body: "Twilio dials you at the exact second you chose. Press 1 to confirm you're out of bed, or 2 to snooze.",
    icon: AlarmClock,
    variant: "accent" as const,
    shadowColor: "#92400e",
    borderColor: "border-accent",
  },
];

const stats = [
  { value: "1 min",   label: "Setup time",        color: "text-primary",    bg: "bg-primary/10",    border: "border-primary/30" },
  { value: "500",     label: "Max script chars",   color: "text-secondary",  bg: "bg-secondary/10",  border: "border-secondary/30" },
  { value: "Press 1/2", label: "Awake or snooze",   color: "text-accent",     bg: "bg-accent/10",     border: "border-accent/30" },
];

/* ─── Dot-grid SVG background (inline, no file dep) ─────────────────── */
function DotGrid({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

/* ─── Floating geometric shapes ─────────────────────────────────────── */
function FloatingShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large violet circle */}
      <div       className="absolute -top-16 -right-16 h-80 w-80 rounded-full bg-primary/10 border-2 border-primary/20" />
      {/* Pink rotated square */}
      <div className="absolute top-24 right-32 h-20 w-20 rotate-20 rounded-lg bg-secondary/15 border-2 border-secondary/25" />
      {/* Yellow triangle-ish */}
      <div className="absolute bottom-12 right-16 h-14 w-14 rotate-35 bg-accent/20 border-2 border-accent/30" />
      {/* Mint pill */}
      <div className="absolute bottom-24 left-8 h-10 w-28 rounded-full bg-quaternary/15 border-2 border-quaternary/25" />
      {/* Small violet dot cluster */}
      <div className="absolute top-1/2 left-1/3 h-6 w-6 rounded-full bg-primary/30" />
      <div className="absolute top-1/2 left-1/3 -translate-y-8 translate-x-8 h-4 w-4 rounded-full bg-secondary/30" />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 py-24 sm:py-32">
        {/* Dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-border/60"
        >
          <DotGrid />
        </div>

        <FloatingShapes />

        <div className="relative mx-auto max-w-5xl">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-primary/10 px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
              AI-powered wake-up calls
            </span>
          </div>

          {/* Headline */}
          <h1 className="max-w-3xl font-sans text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Wake up to a call that{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">knows your name.</span>
              {/* Squiggle underline */}
              <svg
                aria-hidden
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8 C50 2, 100 12, 150 6 S250 2, 298 8"
                  stroke="#a78bfa"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Verify your phone, write your morning message, and let ElevenLabs
            deliver it via Twilio at exactly the time you choose. Press 1 to
            confirm you&apos;re awake.
          </p>

          {/* CTA row */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="lg" className="gap-3">
                  Get started free
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="lg" className="gap-3">
                  Open dashboard
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                </Button>
              </Link>
            </Show>
            <a
              href="#how-it-works"
              className="text-sm font-bold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              How it works ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-muted px-6 py-24">
        <div className="mx-auto max-w-5xl">
          {/* Section header */}
          <div className="mb-14 max-w-xl">
            <p className="mb-3 font-sans text-xs font-bold uppercase tracking-widest text-primary">
              How it works
            </p>
            <h2 className="font-sans text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Three steps to your{" "}
              <span className="text-secondary">perfect morning.</span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {features.map(({ step, title, body, icon, variant, shadowColor, borderColor }) => (
              <div
                key={title}
                className={[
                  "group relative rounded-xl bg-card p-8",
                  `border-2 ${borderColor}`,
                  `shadow-[6px_6px_0px_0px_${shadowColor}]`,
                  "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  "hover:-rotate-1 hover:scale-[1.02]",
                ].join(" ")}
              >
                {/* Step number — decorative background text */}
                <span
                  aria-hidden
                  className="absolute -top-4 -right-2 font-sans text-8xl font-extrabold leading-none select-none opacity-[0.07] text-foreground"
                >
                  {step}
                </span>

                <IconCircle icon={icon} variant={variant} size="lg" />
                <h3 className="mt-6 font-sans text-xl font-extrabold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 py-20">
        {/* Subtle dot grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0 text-border/40">
          <DotGrid />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {stats.map(({ value, label, color, bg, border }) => (
              <div
                key={label}
                className={`rounded-xl ${bg} border-2 ${border} p-8`}
              >
                <p className={`font-sans text-5xl font-extrabold tracking-tight ${color}`}>
                  {value}
                </p>
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t-2 border-border bg-primary/10 px-6 py-24">
        {/* Decorative large circle */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-primary/10 border-2 border-primary/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 left-1/4 h-40 w-40 rotate-20 rounded-2xl bg-secondary/10 border-2 border-secondary/20"
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-sans text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Ready to stop{" "}
              <span className="text-accent">snoozing?</span>
            </h2>
            <p className="mt-3 max-w-md text-lg text-muted-foreground">
              Schedule your first wake-up call in under a minute. No credit card required.
            </p>
          </div>

          <div className="shrink-0">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="lg" className="gap-3">
                  Start for free
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="lg" className="gap-3">
                  Go to dashboard
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                </Button>
              </Link>
            </Show>
          </div>
        </div>
      </section>
    </main>
  );
}
