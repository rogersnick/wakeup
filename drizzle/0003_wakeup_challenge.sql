ALTER TABLE "wakeups" ADD COLUMN "challenge_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "wakeups" ADD COLUMN "challenge_type" text;
--> statement-breakpoint
ALTER TABLE "wakeups" ADD COLUMN "challenge_state" jsonb;
