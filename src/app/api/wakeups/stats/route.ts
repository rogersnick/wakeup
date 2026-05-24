import { jsonError, requireUserId } from "@/lib/api";
import { getWakeUpStats } from "@/lib/wakeup/stats";

export async function GET() {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const stats = await getWakeUpStats(authResult.userId);
    return Response.json({ stats });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load wake-up stats.";
    return jsonError(message, 500);
  }
}
