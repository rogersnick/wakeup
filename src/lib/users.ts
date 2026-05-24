import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

export async function getClerkFirstName(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    return clerkUser.firstName?.trim() || null;
  } catch {
    return null;
  }
}

export async function syncUserDisplayName(user: User): Promise<User> {
  const firstName = await getClerkFirstName(user.id);
  if (!firstName || firstName === user.displayName) {
    return user;
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ displayName: firstName, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();

  return updated ?? user;
}

export async function getOrCreateUserWithProfile(userId: string): Promise<User> {
  const db = getDb();
  let user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    const firstName = await getClerkFirstName(userId);
    const [created] = await db
      .insert(users)
      .values({
        id: userId,
        displayName: firstName,
      })
      .returning();
    user = created;
    return user;
  }

  return syncUserDisplayName(user);
}
