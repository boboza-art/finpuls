import { NextResponse } from "next/server";
import { getSourceHealths, healthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const healths = await getSourceHealths();
  return NextResponse.json({
    success: true,
    data: healths.map((h) => ({
      ...h,
      status: healthStatus(h),
    })),
    summary: {
      total: healths.length,
      healthy: healths.filter((h) => healthStatus(h) === "healthy").length,
      degraded: healths.filter((h) => healthStatus(h) === "degraded").length,
      down: healths.filter((h) => healthStatus(h) === "down").length,
    },
  });
}
