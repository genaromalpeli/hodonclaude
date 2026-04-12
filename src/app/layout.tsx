import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hodon — Motor de IA para investigación accionable",
  description:
    "La frontera del conocimiento no se contempla. Se opera. Hodon convierte investigación y señales emergentes en hipótesis accionables, experimentos y prototipos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-background text-text antialiased">{children}</body>
    </html>
  );
}
