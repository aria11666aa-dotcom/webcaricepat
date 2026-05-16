import { NextResponse } from "next/server";
import { setKeyword, getKeywords, getLabels, normalize } from "@/lib/redis";
import { isAuthenticated } from "@/lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { keyword?: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const keyword = normalize(body.keyword || "");
  const label = normalize(body.label || "");

  if (!keyword) return NextResponse.json({ error: "Keyword wajib diisi" }, { status: 400 });
  if (!label) return NextResponse.json({ error: "Label wajib dipilih" }, { status: 400 });

  const labels = await getLabels();
  if (!labels[label]) {
    return NextResponse.json({ error: `Label "${label}" tidak ada. Buat label dulu.` }, { status: 400 });
  }

  const existing = await getKeywords();
  if (existing[keyword]) {
    return NextResponse.json({ error: `Keyword "${keyword}" sudah ada` }, { status: 409 });
  }

  try {
    await setKeyword(keyword, label);
    return NextResponse.json({ ok: true, keyword, label });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}
