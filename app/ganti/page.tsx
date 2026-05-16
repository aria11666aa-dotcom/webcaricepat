"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GantiPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login gagal");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6">
      <div className="mesh-bg" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 glass rounded-3xl p-8 w-full max-w-sm border border-white/5 shadow-2xl flex flex-col gap-5"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white/90">Akses Terbatas</h1>
          <p className="text-white/40 text-sm mt-1">Masukkan kredensial untuk melanjutkan</p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="off"
            spellCheck={false}
            required
            className="bg-white/5 text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-indigo-400/40 outline-none transition"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="off"
            required
            className="bg-white/5 text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-indigo-400/40 outline-none transition"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-gradient rounded-xl px-4 py-3 text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}
