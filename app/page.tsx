"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Link Database ────────────────────────────────────────────────────────────
// Tambahkan keyword baru di sini:
// "keyword": "https://linknya.com"
const LINK_DATABASE: Record<string, string> = {
  "naga": "https://t.ly/masuknaga",
  "naga 138": "https://t.ly/masuknaga",
  "naga138": "https://t.ly/masuknaga",
};

// Normalize input: lowercase + trim extra spaces
function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

function findLink(query: string): string | null {
  const key = normalize(query);
  return LINK_DATABASE[key] ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = "loading" | "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  sub?: string;
}

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (toast.type === "loading") return;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onRemove, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.type, onRemove]);

  const icons = {
    loading: (
      <div className="flex gap-1 items-center">
        <span className="loading-dot w-2 h-2 rounded-full bg-indigo-400 inline-block" />
        <span className="loading-dot w-2 h-2 rounded-full bg-indigo-400 inline-block" />
        <span className="loading-dot w-2 h-2 rounded-full bg-indigo-400 inline-block" />
      </div>
    ),
    success: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  const colors = {
    loading: "border-indigo-400/60 bg-indigo-950",
    success: "border-emerald-400/60 bg-emerald-950",
    error: "border-red-400/60 bg-red-950",
  };

  return (
    <div
      className={`rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl border w-[320px] pointer-events-auto backdrop-blur-none ${colors[toast.type]} ${exiting ? "toast-exit" : "toast-enter"}`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 text-center">
        <p className="text-sm font-bold text-white">{toast.message}</p>
        {toast.sub && <p className="text-xs text-white/70 mt-0.5">{toast.sub}</p>}
      </div>
    </div>
  );
}

// ─── Particle Background ──────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
    }[] = [];

    const colors = ["#6366f1", "#8b5cf6", "#06b6d4", "#a78bfa"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99,102,241,${(1 - dist / 120) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="particles" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [query, setQuery] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastIdRef = useRef(0);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      inputRef.current?.focus();
      return;
    }

    setIsSearching(true);
    const loadingId = addToast({ type: "loading", message: "Mencari link...", sub: `"${query}"` });

    // Simulate search delay for UX
    await new Promise((r) => setTimeout(r, 800));

    const link = findLink(query);
    removeToast(loadingId);
    setIsSearching(false);

    if (link) {
      addToast({
        type: "success",
        message: "Link ditemukan! Mengalihkan...",
        sub: "Membuka di tab baru",
      });
      setTimeout(() => {
        window.open(link, "_blank", "noopener,noreferrer");
      }, 400);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      addToast({
        type: "error",
        message: "Link tidak ditemukan",
        sub: `Kata kunci "${query}" tidak tersedia`,
      });
    }
  }, [query, addToast, removeToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="mesh-bg" />
      <Particles />

      {/* Decorative Rings */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
        <div className="orbit-ring w-[600px] h-[600px] absolute -translate-x-1/2 -translate-y-1/2 opacity-20" />
        <div
          className="orbit-ring w-[900px] h-[900px] absolute -translate-x-1/2 -translate-y-1/2 opacity-10"
          style={{ animationDuration: "35s", animationDirection: "reverse" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-6 py-16 flex flex-col items-center gap-10 animate-slide-up">

        {/* Logo & Title */}
        <div className="text-center flex flex-col items-center gap-4">
          {/* Icon */}
          <div className="relative animate-float">
            <div className="w-20 h-20 rounded-3xl btn-gradient flex items-center justify-center shadow-2xl animate-pulse-glow">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            {/* Glow dot */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0a0a0f] animate-pulse" />
          </div>

          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="gradient-text">CariCepat</span>
            </h1>
            <p className="text-white/40 text-sm mt-2 font-medium tracking-widest uppercase">
              Pencarian Link Terpercaya
            </p>
          </div>

          <p className="text-white/50 text-base max-w-md leading-relaxed">
            Ketik nama situs atau kata kunci, lalu klik <span className="text-indigo-400 font-semibold">Cari</span> — dan kamu langsung diarahkan ke halaman yang tepat.
          </p>
        </div>

        {/* Search Card */}
        <div className="glass rounded-3xl p-2 w-full shadow-2xl border border-white/5">
          <div className="flex gap-2">
            {/* Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik kata kunci..."
                className={`input-glow w-full bg-white/5 text-white placeholder-white/25 rounded-2xl pl-12 pr-4 py-4 text-base font-medium border border-white/10 transition-all duration-200 ${shake ? "animate-shake" : ""}`}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Button */}
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="btn-gradient rounded-2xl px-6 py-4 text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isSearching ? (
                <>
                  <div className="flex gap-1">
                    <span className="loading-dot w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                    <span className="loading-dot w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                    <span className="loading-dot w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                  </div>
                </>
              ) : (
                <>
                  <span>Cari</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="w-full flex flex-col gap-4">
          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-white/20 text-xs font-medium tracking-widest uppercase">Tentang CariCepat</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1 */}
            <div className="glass rounded-2xl p-5 flex flex-col gap-3 border border-white/5 hover:border-indigo-500/20 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm font-semibold mb-1">Apa itu CariCepat?</p>
                <p className="text-white/35 text-xs leading-relaxed">
                  CariCepat adalah portal pencarian link cepat yang memudahkan kamu menemukan dan mengakses situs favorit hanya dengan satu kata kunci — tanpa perlu mengingat URL panjang.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass rounded-2xl p-5 flex flex-col gap-3 border border-white/5 hover:border-violet-500/20 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm font-semibold mb-1">Cara Penggunaan</p>
                <p className="text-white/35 text-xs leading-relaxed">
                  Cukup ketik <span className="text-violet-400 font-medium">nama situs</span> atau <span className="text-violet-400 font-medium">kata kunci</span> di kolom pencarian, lalu klik tombol Cari. Kamu akan langsung diarahkan ke halaman yang kamu tuju.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass rounded-2xl p-5 flex flex-col gap-3 border border-white/5 hover:border-cyan-500/20 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm font-semibold mb-1">Aman & Anti Blokir</p>
                <p className="text-white/35 text-xs leading-relaxed">
                  Semua link di sini <span className="text-cyan-400 font-medium">dijamin aman</span>, bebas dari blokir Nawala, anti-phishing, dan merupakan tautan resmi. Simpan halaman ini dan akses kapan saja tanpa khawatir.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom status strip */}
          <div className="flex items-center justify-center gap-6 text-white/18 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span>Online & Aktif</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Tautan Resmi & Terverifikasi</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Akses Instan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-white/15 text-xs py-6">
        <p>© {new Date().getFullYear()} CariCepat. All rights reserved.</p>
      </footer>

      {/* Toast Container */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 items-center pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </main>
  );
}
