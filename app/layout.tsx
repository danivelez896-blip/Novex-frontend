import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novex",
  description: "Plataforma universal de devoluciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 text-white">
        <div className="min-h-screen">
          <aside className="fixed inset-y-0 left-0 w-64 border-r border-zinc-800 bg-zinc-950">
            <div className="flex h-full flex-col px-4 py-6">
              <div className="mb-8 px-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Plataforma de devoluciones
                </p>
                <h1 className="mt-2 text-2xl font-semibold">Novex</h1>
              </div>

              <nav className="space-y-2 text-sm">
                <Link
                  href="/"
                  className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Dashboard
                </Link>

                <Link
                  href="/cases"
                  className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Devoluciones
                </Link>

                <Link
                  href="/orders"
                  className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Pedidos
                </Link>

                <Link
                  href="/customers"
                  className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Clientes
                </Link>

                <Link
                  href="/return-rules"
                  className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Reglas
                </Link>

                <Link
                  href="/settings"
                  className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Configuración
                </Link>
              </nav>

              <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-sm font-medium">Novex Demo Store</p>
                <p className="mt-1 text-xs text-zinc-500">Shopify</p>
              </div>
            </div>
          </aside>

          <main className="ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}