"use client";

import { WakeupList } from "@/components/wakeup-list";

export default function WakeupsPage() {
  return (
    <main className="bg-muted min-h-[calc(100vh-4rem)]">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
            Scheduled calls + attempt history
          </p>
          <h1 className="mt-2 font-sans text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            All wake-ups
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            View scheduled calls, check their status, and cancel any you no
            longer need.
          </p>
        </div>

        <WakeupList />
      </div>
    </main>
  );
}
