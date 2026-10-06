import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./AppShell";

export const metadata: Metadata = {
  title: "Novex",
  description:
    "Plataforma universal de devoluciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 text-white">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
