import { NextRequest, NextResponse } from "next/server";
import { runAutoScore } from "@/lib/auto-score";

export async function GET(req: NextRequest) {
  // Verify the cron secret to prevent unauthorized triggering
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron] Auto-score triggered");
    const result = await runAutoScore();
    console.log("[cron] Auto-score complete:", result);

    return NextResponse.json({
      ok: true,
      scored: result.scored,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[cron] Auto-score failed:", err);
    return NextResponse.json(
      { error: "Auto-score failed", detail: String(err) },
      { status: 500 }
    );
  }
}
