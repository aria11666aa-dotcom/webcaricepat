import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CariCepat — Pencarian Link Terpercaya",
  description: "Cari dan akses link situs favoritmu dengan cepat dan aman. Ketik kata kunci, langsung terhubung.",
  keywords: "caricepat, cari cepat, portal, link, pencarian, redirect, aman",
  authors: [{ name: "CariCepat" }],
  openGraph: {
    title: "CariCepat — Pencarian Link Terpercaya",
    description: "Cari dan akses link situs favoritmu dengan cepat dan aman.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
