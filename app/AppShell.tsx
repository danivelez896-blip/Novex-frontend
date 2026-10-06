"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Dashboard" },
  {
    href: "/cases",
    label: "Devoluciones",
  },
  { href: "/orders", label: "Pedidos" },
  {
    href: "/customers",
    label: "Clientes",
  },
  {
    href: "/return-rules",
    label: "Reglas",
  },
  {
    href: "/settings",
    label: "Configuración",
  },
];

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/return/");

  if (isPublic) {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-zinc-800 bg-zinc-950">
        <div className="flex h-full flex-col px-4 py-6">
          <div className="mb-8 px-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Plataforma de devoluciones
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Novex
            </h1>
          </div>

          <nav className="space-y-2 text-sm">
            {navigation.map(
              (item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" &&
                    pathname.startsWith(
                      `${item.href}/`
                    ));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-3 py-2 transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
            )}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-sm font-medium">
                Novex Demo Store
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Shopify
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-zinc-800 px-3 py-2 text-left text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
