ALTER TABLE "users" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "wakeups" ADD COLUMN "snooze_count" integer DEFAULT 0 NOT NULL;
