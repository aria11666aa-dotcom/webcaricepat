import { NextResponse } from "next/server";
import { setLabel, deleteLabel, getLabels, getKeywords, deleteKeywordsByLabel, normalize } from "@/lib/redis";
import { isAuthenticated } from "@/lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name: rawName } = await params;
  const name = normalize(decodeURIComponent(rawName));
  if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const url = (body.url || "").trim();
  if (!/^https?:\/\/.+/i.test(url)) {
    return NextResponse.json({ error: "URL harus diawali http:// atau https://" }, { status: 400 });
  }

  const labels = await getLabels();
  if (!labels[name]) {
    return NextResponse.json({ error: `Label "${name}" tidak ditemukan` }, { status: 404 });
  }

  try {
    await setLabel(name, url);
    return NextResponse.json({ ok: true, name, url });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name: rawName } = await params;
  const name = normalize(decodeURIComponent(rawName));
  if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  const url = new URL(req.url);
  const cascade = url.searchParams.get("cascade") === "1";

  const keywords = await getKeywords();
  const linkedCount = Object.values(keywords).filter((lbl) => lbl === name).length;

  if (linkedCount > 0 && !cascade) {
    return NextResponse.json(
      { error: `Label masih dipakai oleh ${linkedCount} keyword. Tambahkan ?cascade=1 untuk hapus semua.`, linkedCount },
      { status: 409 }
    );
  }

  try {
    if (cascade && linkedCount > 0) {
      await deleteKeywordsByLabel(name);
    }
    await deleteLabel(name);
    return NextResponse.json({ ok: true, deletedKeywords: cascade ? linkedCount : 0 });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
