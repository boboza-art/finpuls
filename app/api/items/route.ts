import { NextRequest, NextResponse } from "next/server";
import { getTimeline } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50");

  const timeline = await getTimeline(limit, tag);
  return NextResponse.json({
    success: true,
    data: timeline,
    count: timeline.reduce((sum, g) => sum + g.items.length, 0),
  });
}
