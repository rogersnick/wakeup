import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireUserId() {
  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { userId };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
