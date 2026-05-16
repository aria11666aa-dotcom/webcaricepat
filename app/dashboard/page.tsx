"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type LabelMap = Record<string, string>;
type KeywordMap = Record<string, string>;

export default function DashboardPage() {
  const router = useRouter();
  const [labels, setLabels] = useState<LabelMap>({});
  const [keywords, setKeywords] = useState<KeywordMap>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelUrl, setNewLabelUrl] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editLabelUrl, setEditLabelUrl] = useState("");

  const [newKeyword, setNewKeyword] = useState("");
  const [newKeywordLabel, setNewKeywordLabel] = useState("");
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [editKeywordLabel, setEditKeywordLabel] = useState("");

  const flash = useCallback((type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 2500);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/ganti");
        return;
      }
      const data = await res.json();
      setLabels(data.labels || {});
      setKeywords(data.keywords || {});
      if (data.migration?.migrated) {
        flash("ok", `Migrasi data lama berhasil: ${data.migration.labels} label, ${data.migration.keywords} keyword`);
      }
    } catch {
      flash("err", "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [router, flash]);

  useEffect(() => {
    load();
  }, [load]);

  async function addLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabelName.trim() || !newLabelUrl.trim()) return;
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLabelName.trim(), url: newLabelUrl.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNewLabelName("");
      setNewLabelUrl("");
      flash("ok", "Label ditambahkan");
      load();
    } else {
      flash("err", data.error || "Gagal menambah");
    }
  }

  async function saveLabel(name: string) {
    if (!editLabelUrl.trim()) return;
    const res = await fetch(`/api/labels/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: editLabelUrl.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setEditingLabel(null);
      setEditLabelUrl("");
      flash("ok", `URL label "${name}" diperbarui — semua keyword ikut berubah`);
      load();
    } else {
      flash("err", data.error || "Gagal memperbarui");
    }
  }

  async function removeLabel(name: string) {
    const linked = Object.entries(keywords).filter(([, lbl]) => lbl === name).length;
    let url = `/api/labels/${encodeURIComponent(name)}`;
    if (linked > 0) {
      if (!confirm(`Label "${name}" dipakai oleh ${linked} keyword. Hapus label + semua keyword-nya?`)) return;
      url += "?cascade=1";
    } else {
      if (!confirm(`Hapus label "${name}"?`)) return;
    }
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      flash("ok", "Label dihapus");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      flash("err", data.error || "Gagal menghapus");
    }
  }

  async function addKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyword.trim() || !newKeywordLabel) return;
    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: newKeyword.trim(), label: newKeywordLabel }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNewKeyword("");
      setNewKeywordLabel("");
      flash("ok", "Keyword ditambahkan");
      load();
    } else {
      flash("err", data.error || "Gagal menambah");
    }
  }

  async function saveKeyword(keyword: string) {
    if (!editKeywordLabel) return;
    const res = await fetch(`/api/keywords/${encodeURIComponent(keyword)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editKeywordLabel }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setEditingKeyword(null);
      setEditKeywordLabel("");
      flash("ok", "Keyword diperbarui");
      load();
    } else {
      flash("err", data.error || "Gagal memperbarui");
    }
  }

  async function removeKeyword(keyword: string) {
    if (!confirm(`Hapus keyword "${keyword}"?`)) return;
    const res = await fetch(`/api/keywords/${encodeURIComponent(keyword)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      flash("ok", "Keyword dihapus");
      load();
    } else {
      flash("err", "Gagal menghapus");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/ganti");
    router.refresh();
  }

  const labelEntries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  const keywordEntries = Object.entries(keywords).sort(([a], [b]) => a.localeCompare(b));
  const labelOptions = labelEntries.map(([name]) => name);
  const keywordCountByLabel = keywordEntries.reduce<Record<string, number>>((acc, [, lbl]) => {
    acc[lbl] = (acc[lbl] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="relative min-h-screen px-6 py-10">
      <div className="mesh-bg" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/90">Kelola Link</h1>
            <p className="text-white/40 text-sm">Label menyimpan URL — keyword menunjuk ke label</p>
          </div>
          <button
            onClick={logout}
            className="text-white/50 hover:text-white text-sm border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition"
          >
            Keluar
          </button>
        </header>

        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm border ${
              message.type === "ok"
                ? "bg-emerald-950 border-emerald-400/40 text-emerald-300"
                : "bg-red-950 border-red-400/40 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* LABELS SECTION */}
        <section className="glass rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
          <div>
            <p className="text-white/80 text-sm font-semibold">Label (target URL)</p>
            <p className="text-white/40 text-xs mt-0.5">
              Ubah URL di sini sekali → semua keyword dengan label ini ikut berubah otomatis.
            </p>
          </div>

          <form onSubmit={addLabel} className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="nama label (contoh: naga)"
              className="flex-1 bg-white/5 text-white placeholder-white/25 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-indigo-400/40 outline-none"
            />
            <input
              type="url"
              value={newLabelUrl}
              onChange={(e) => setNewLabelUrl(e.target.value)}
              placeholder="https://..."
              className="flex-[2] bg-white/5 text-white placeholder-white/25 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-indigo-400/40 outline-none"
            />
            <button type="submit" className="btn-gradient rounded-lg px-4 py-2 text-white text-sm font-semibold">
              Tambah Label
            </button>
          </form>

          {loading ? (
            <p className="text-white/40 text-sm py-4 text-center">Memuat...</p>
          ) : labelEntries.length === 0 ? (
            <p className="text-white/40 text-sm py-4 text-center">Belum ada label.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {labelEntries.map(([name, url]) => (
                <div
                  key={name}
                  className="bg-white/5 rounded-lg border border-white/5 p-3 flex flex-col md:flex-row md:items-center gap-2"
                >
                  <div className="md:w-40 flex-shrink-0 flex items-center gap-2">
                    <span className="text-indigo-300 text-sm font-mono break-all">{name}</span>
                    <span className="text-white/30 text-xs">({keywordCountByLabel[name] || 0} kw)</span>
                  </div>
                  {editingLabel === name ? (
                    <input
                      type="url"
                      value={editLabelUrl}
                      onChange={(e) => setEditLabelUrl(e.target.value)}
                      className="flex-1 bg-white/10 text-white rounded px-2 py-1 text-sm border border-indigo-400/40 outline-none"
                      autoFocus
                    />
                  ) : (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-white/70 text-sm hover:text-white truncate"
                    >
                      {url}
                    </a>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
                    {editingLabel === name ? (
                      <>
                        <button onClick={() => saveLabel(name)} className="text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1">
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setEditingLabel(null);
                            setEditLabelUrl("");
                          }}
                          className="text-white/40 hover:text-white text-xs px-2 py-1"
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingLabel(name);
                            setEditLabelUrl(url);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1"
                        >
                          Ubah URL
                        </button>
                        <button onClick={() => removeLabel(name)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1">
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* KEYWORDS SECTION */}
        <section className="glass rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
          <div>
            <p className="text-white/80 text-sm font-semibold">Keyword (pencarian user)</p>
            <p className="text-white/40 text-xs mt-0.5">
              Tiap keyword menunjuk ke satu label. Saat user cari keyword, dia diarahkan ke URL label.
            </p>
          </div>

          <form onSubmit={addKeyword} className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="keyword (contoh: naga138)"
              className="flex-1 bg-white/5 text-white placeholder-white/25 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-indigo-400/40 outline-none"
            />
            <select
              value={newKeywordLabel}
              onChange={(e) => setNewKeywordLabel(e.target.value)}
              className="flex-1 bg-white/5 text-white rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-indigo-400/40 outline-none"
            >
              <option value="" className="bg-neutral-900">
                — pilih label —
              </option>
              {labelOptions.map((lbl) => (
                <option key={lbl} value={lbl} className="bg-neutral-900">
                  {lbl}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={labelOptions.length === 0}
              className="btn-gradient rounded-lg px-4 py-2 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tambah Keyword
            </button>
          </form>

          {labelOptions.length === 0 && (
            <p className="text-amber-400/80 text-xs">Buat label dulu sebelum menambah keyword.</p>
          )}

          {loading ? (
            <p className="text-white/40 text-sm py-4 text-center">Memuat...</p>
          ) : keywordEntries.length === 0 ? (
            <p className="text-white/40 text-sm py-4 text-center">Belum ada keyword.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {keywordEntries.map(([keyword, label]) => (
                <div
                  key={keyword}
                  className="bg-white/5 rounded-lg border border-white/5 p-3 flex flex-col md:flex-row md:items-center gap-2"
                >
                  <div className="md:w-48 flex-shrink-0">
                    <span className="text-white/80 text-sm font-mono break-all">{keyword}</span>
                  </div>
                  {editingKeyword === keyword ? (
                    <select
                      value={editKeywordLabel}
                      onChange={(e) => setEditKeywordLabel(e.target.value)}
                      className="flex-1 bg-white/10 text-white rounded px-2 py-1 text-sm border border-indigo-400/40 outline-none"
                      autoFocus
                    >
                      {labelOptions.map((lbl) => (
                        <option key={lbl} value={lbl} className="bg-neutral-900">
                          {lbl}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="flex-1 text-sm">
                      <span className="text-white/40">→ </span>
                      <span className="text-indigo-300 font-mono">{label}</span>
                      {!labels[label] && (
                        <span className="text-red-400 text-xs ml-2">(label hilang!)</span>
                      )}
                    </span>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
                    {editingKeyword === keyword ? (
                      <>
                        <button onClick={() => saveKeyword(keyword)} className="text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1">
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setEditingKeyword(null);
                            setEditKeywordLabel("");
                          }}
                          className="text-white/40 hover:text-white text-xs px-2 py-1"
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingKeyword(keyword);
                            setEditKeywordLabel(label);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1"
                        >
                          Ubah Label
                        </button>
                        <button onClick={() => removeKeyword(keyword)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1">
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
