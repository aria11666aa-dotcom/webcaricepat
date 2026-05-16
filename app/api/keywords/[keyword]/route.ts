import { NextResponse } from "next/server";
import { setKeyword, deleteKeyword, getKeywords, getLabels, normalize } from "@/lib/redis";
import { isAuthenticated } from "@/lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ keyword: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword: rawKeyword } = await params;
  const keyword = normalize(decodeURIComponent(rawKeyword));
  if (!keyword) return NextResponse.json({ error: "Invalid keyword" }, { status: 400 });

  let body: { label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const label = normalize(body.label || "");
  if (!label) return NextResponse.json({ error: "Label wajib dipilih" }, { status: 400 });

  const [labels, keywords] = await Promise.all([getLabels(), getKeywords()]);
  if (!labels[label]) {
    return NextResponse.json({ error: `Label "${label}" tidak ada` }, { status: 400 });
  }
  if (!keywords[keyword]) {
    return NextResponse.json({ error: "Keyword tidak ditemukan" }, { status: 404 });
  }

  try {
    await setKeyword(keyword, label);
    return NextResponse.json({ ok: true, keyword, label });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ keyword: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword: rawKeyword } = await params;
  const keyword = normalize(decodeURIComponent(rawKeyword));
  if (!keyword) return NextResponse.json({ error: "Invalid keyword" }, { status: 400 });

  try {
    await deleteKeyword(keyword);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
