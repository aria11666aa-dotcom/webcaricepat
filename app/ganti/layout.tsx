import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

export default function GantiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
