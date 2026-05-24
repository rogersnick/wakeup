import { processDueWakeups } from "@/lib/wakeup/cron";

export const maxDuration = 60;

async function runCron(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { results, recovered } = await processDueWakeups();
    return Response.json({
      ok: true,
      processed: results.length,
      recovered: recovered.length,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cron processing failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return runCron(request);
}

export async function POST(request: Request) {
  return runCron(request);
}
