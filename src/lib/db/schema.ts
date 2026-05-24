import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const wakeupTypeEnum = pgEnum("wakeup_type", ["one_shot", "recurring"]);
export const wakeupStatusEnum = pgEnum("wakeup_status", [
  "scheduled",
  "calling",
  "confirmed",
  "exhausted",
  "cancelled",
]);
export const wakeupScriptModeEnum = pgEnum("wakeup_script_mode", [
  "static",
  "dynamic",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phoneE164: text("phone_e164"),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  timezone: text("timezone").notNull().default("America/Toronto"),
  city: text("city"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const phoneOtps = pgTable(
  "phone_otps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phoneE164: text("phone_e164").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("phone_otps_user_id_idx").on(table.userId)],
);

export const wakeups = pgTable(
  "wakeups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: wakeupTypeEnum("type").notNull(),
    scheduledTimeLocal: text("scheduled_time_local").notNull(),
    scheduledDate: text("scheduled_date"),
    recurrence: jsonb("recurrence").$type<{ days: number[] } | null>(),
    scriptText: text("script_text").notNull(),
    scriptMode: wakeupScriptModeEnum("script_mode").notNull().default("static"),
    resolvedScriptText: text("resolved_script_text"),
    voiceId: text("voice_id").notNull(),
    audioBlobUrl: text("audio_blob_url"),
    status: wakeupStatusEnum("status").notNull().default("scheduled"),
    nextAttemptAt: timestamp("next_attempt_at", {
      withTimezone: true,
    }).notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    retryIntervalMinutes: integer("retry_interval_minutes")
      .notNull()
      .default(5),
    lastCallSid: text("last_call_sid"),
    lastCallStatus: text("last_call_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("wakeups_status_next_attempt_idx").on(
      table.status,
      table.nextAttemptAt,
    ),
    index("wakeups_user_id_idx").on(table.userId),
  ],
);

export const wakeupAttempts = pgTable(
  "wakeup_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    wakeupId: uuid("wakeup_id")
      .notNull()
      .references(() => wakeups.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    callSid: text("call_sid"),
    status: text("status").notNull(),
    gatherResult: text("gather_result"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("wakeup_attempts_wakeup_id_idx").on(table.wakeupId),
  ],
);

export type User = typeof users.$inferSelect;
export type Wakeup = typeof wakeups.$inferSelect;
export type WakeupAttempt = typeof wakeupAttempts.$inferSelect;
