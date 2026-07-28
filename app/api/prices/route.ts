import { NextResponse } from "next/server";
import { getPrices } from "@/lib/prices";

export const dynamic = "force-dynamic";

export async function GET() {
  const prices = await getPrices();
  return NextResponse.json({
    success: true,
    data: prices,
    updatedAt: Date.now(),
  });
}
