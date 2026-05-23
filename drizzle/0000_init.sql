CREATE TYPE "public"."wakeup_type" AS ENUM('one_shot', 'recurring');
CREATE TYPE "public"."wakeup_status" AS ENUM('scheduled', 'calling', 'confirmed', 'exhausted', 'cancelled');

CREATE TABLE "users" (
  "id" text PRIMARY KEY NOT NULL,
  "phone_e164" text,
  "phone_verified_at" timestamp with time zone,
  "timezone" text DEFAULT 'America/Toronto' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "phone_otps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "phone_e164" text NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "wakeups" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "type" "wakeup_type" NOT NULL,
  "scheduled_time_local" text NOT NULL,
  "scheduled_date" text,
  "recurrence" jsonb,
  "script_text" text NOT NULL,
  "voice_id" text NOT NULL,
  "audio_blob_url" text NOT NULL,
  "status" "wakeup_status" DEFAULT 'scheduled' NOT NULL,
  "next_attempt_at" timestamp with time zone NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 3 NOT NULL,
  "retry_interval_minutes" integer DEFAULT 5 NOT NULL,
  "last_call_sid" text,
  "last_call_status" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "wakeup_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "wakeup_id" uuid NOT NULL,
  "attempt_number" integer NOT NULL,
  "call_sid" text,
  "status" text NOT NULL,
  "gather_result" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

ALTER TABLE "phone_otps"
  ADD CONSTRAINT "phone_otps_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wakeups"
  ADD CONSTRAINT "wakeups_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wakeup_attempts"
  ADD CONSTRAINT "wakeup_attempts_wakeup_id_wakeups_id_fk"
  FOREIGN KEY ("wakeup_id") REFERENCES "public"."wakeups"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "phone_otps_user_id_idx" ON "phone_otps" USING btree ("user_id");
CREATE INDEX "wakeups_status_next_attempt_idx" ON "wakeups" USING btree ("status", "next_attempt_at");
CREATE INDEX "wakeups_user_id_idx" ON "wakeups" USING btree ("user_id");
CREATE INDEX "wakeup_attempts_wakeup_id_idx" ON "wakeup_attempts" USING btree ("wakeup_id");
