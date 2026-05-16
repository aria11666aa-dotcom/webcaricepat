import { NextResponse } from "next/server";
import { getLabels, getKeywords, runMigrationIfNeeded } from "@/lib/redis";
import { isAuthenticated } from "@/lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const migration = await runMigrationIfNeeded();
    const [labels, keywords] = await Promise.all([getLabels(), getKeywords()]);
    return NextResponse.json({ labels, keywords, migration });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
