import { NextResponse } from "next/server";
import { getFlatLinks, runMigrationIfNeeded } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await runMigrationIfNeeded();
    const links = await getFlatLinks();
    return NextResponse.json({ links });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
