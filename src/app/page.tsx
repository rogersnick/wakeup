import { Show, SignInButton } from "@clerk/nextjs";
import { ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function AuthCta({ signedOutLabel, signedInLabel }: {
  signedOutLabel: string;
  signedInLabel: string;
}) {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button size="lg" className="group gap-4">
            {signedOutLabel}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-100 group-hover:translate-x-1"
              strokeWidth={1.5}
            />
          </Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard">
          <Button size="lg" className="group gap-4">
            {signedInLabel}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-100 group-hover:translate-x-1"
              strokeWidth={1.5}
            />
          </Button>
        </Link>
      </Show>
    </>
  );
}

const taglines = [
  {a: "Wake", b: "Up", c: "Nick." }
];

export default function Home() {
  const tagline = taglines[Math.floor(Math.random() * taglines.length)];
  return (
    <main id="main-content" className="texture-paper bg-background text-foreground">
      <a
        href="#main-copy"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:border-2 focus:border-foreground focus:bg-foreground focus:px-4 focus:py-3 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-background"
      >
        Skip to content
      </a>

      <section className="texture-lines relative overflow-hidden px-6 py-20 sm:py-28 lg:py-36">
        <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div id="main-copy">
            <div className="mb-10 flex items-center gap-4">
              <div className="h-1 w-24 bg-foreground sm:w-36" aria-hidden />
              <div className="h-4 w-4 border-2 border-foreground" aria-hidden />
              <p className="font-mono text-xs font-medium uppercase tracking-widest">
                AI wake-up calls
              </p>
            </div>

            <h1 className="max-w-5xl font-serif text-[clamp(4.5rem,16vw,10rem)] font-semibold leading-none tracking-tighter">
              {tagline.a}
              <span className="block italic">{tagline.b}</span>
              {tagline.c}
            </h1>

            <p className="mt-10 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
              Some mornings, you can&apos;t afford to hit snooze. The flight.
              The interview. The thing that only comes once. AlarmCall is for
              those mornings — a real phone call, at the exact time you set,
              that doesn&apos;t stop until you answer.
            </p>

            <div className="mt-12">
              <AuthCta signedOutLabel="Begin" signedInLabel="Open dashboard" />
            </div>
          </div>

          <aside className="border-2 border-foreground bg-background p-6 lg:p-8">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Tomorrow
            </p>
            <p className="mt-6 font-serif text-6xl leading-none tracking-tight">
              06:30
            </p>
            <div className="my-8 h-1 bg-foreground" aria-hidden />
            <p className="text-lg italic leading-relaxed">
              &ldquo;Good morning. Stand up, press 1, and start before the day
              starts negotiating.&rdquo;
            </p>
            <div className="mt-8 grid grid-cols-2 border border-foreground font-mono text-xs uppercase tracking-widest">
              <span className="border-r border-foreground p-3">Press 1</span>
              <span className="p-3">Awake</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="relative overflow-hidden border-t-4 border-foreground bg-foreground px-6 py-24 text-background lg:py-32">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-80 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at top center, #000000, transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <CalendarClock className="h-6 w-6" strokeWidth={1.5} />
              <p className="font-mono text-xs font-medium uppercase tracking-widest">
                Schedule the first call
              </p>
            </div>
            <h2 className="max-w-4xl font-serif text-6xl leading-none tracking-tighter sm:text-8xl">
              Make tomorrow non-negotiable.
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <AuthCta signedOutLabel="Start free" signedInLabel="Schedule now" />
          </div>
        </div>
      </section>
    </main>
  );
}
