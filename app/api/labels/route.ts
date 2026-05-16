import { NextResponse } from "next/server";
import { getLabels, setLabel, normalize } from "@/lib/redis";
import { isAuthenticated } from "@/lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = normalize(body.name || "");
  const url = (body.url || "").trim();

  if (!name) return NextResponse.json({ error: "Nama label wajib diisi" }, { status: 400 });
  if (!/^https?:\/\/.+/i.test(url)) {
    return NextResponse.json({ error: "URL harus diawali http:// atau https://" }, { status: 400 });
  }

  const existing = await getLabels();
  if (existing[name]) {
    return NextResponse.json({ error: `Label "${name}" sudah ada` }, { status: 409 });
  }

  try {
    await setLabel(name, url);
    return NextResponse.json({ ok: true, name, url });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}
