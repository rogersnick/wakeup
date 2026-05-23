import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
      <section className="max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-amber-700">
          V0
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Wake up to a call that knows your name.
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">
          Verify your phone, write your message, and get an ElevenLabs voice call
          at the time you choose. Press 1 to confirm you&apos;re awake.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Verify phone", "SMS OTP before anything is scheduled."],
          ["Generate audio", "ElevenLabs turns your script into an MP3."],
          ["Call on time", "Cron + Twilio dial you when nextAttemptAt hits."],
        ].map(([title, body]) => (
          <div
            key={title}
            className="rounded-2xl border border-stone-200 bg-white p-5"
          >
            <h2 className="font-medium text-stone-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white">
              Get started
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white"
          >
            Open dashboard
          </Link>
        </Show>
      </div>
    </main>
  );
}
