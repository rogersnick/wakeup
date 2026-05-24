ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'weather_report';--> statement-breakpoint
ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'local_news';--> statement-breakpoint
ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'sports_scores';--> statement-breakpoint
ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'market_brief';--> statement-breakpoint
ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'horoscope';--> statement-breakpoint
ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'daily_motivation';--> statement-breakpoint
ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'history_today';--> statement-breakpoint
ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'word_of_day';--> statement-breakpoint
ALTER TYPE "public"."wakeup_script_mode" ADD VALUE IF NOT EXISTS 'fun_fact';--> statement-breakpoint
UPDATE "wakeups" SET "script_mode" = 'weather_report' WHERE "script_mode" = 'dynamic';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "favorite_team" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "market_symbols" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zodiac_sign" text;--> statement-breakpoint
ALTER TABLE "wakeups" ADD COLUMN IF NOT EXISTS "content_config" jsonb;
