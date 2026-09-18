import { NextResponse } from "next/server";
import { getAutoNewsCount, getAutoNewsUpdatedAt } from "@/content/auto-news";
import { getAutoToolsCount, getAutoToolsUpdatedAt } from "@/content/auto-tools";

export const dynamic = "force-dynamic";

/**
 * Liveness plus the age of the content this deployment is actually serving.
 *
 * The watchdog used to judge freshness by reading auto-news.json off whatever
 * was checked out locally, which answers a different question than the one that
 * matters. A local clone six commits behind reported the site as three days
 * stale when it had updated that morning; the same blind spot hides the failure
 * that actually costs readers, where the agent commits fine but the deploy
 * never ships it. Reporting it from the running deployment makes the check
 * measure what a reader would see.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "ai-student-hub",
      timestamp: new Date().toISOString(),
      content: {
        newsUpdatedAt: getAutoNewsUpdatedAt(),
        newsItems: getAutoNewsCount(),
        toolsUpdatedAt: getAutoToolsUpdatedAt(),
        toolsItems: getAutoToolsCount()
      }
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
