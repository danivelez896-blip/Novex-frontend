"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

type SessionCompany = {
  membershipId: number;
  companyId: number;
  companyName: string;
  role:
    | "OWNER"
    | "ADMIN"
    | "EMPLOYEE"
    | "READ_ONLY";
  permissions: string[];
};

type SessionStore = {
  id: number;
  companyId: number;
  name: string;
  platform: string;
  domain: string | null;
};

type SessionData = {
  authenticated: boolean;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  companies?: SessionCompany[];
  stores?: SessionStore[];
  activeStoreId?: number | null;
};

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

  const [session, setSession] =
    useState<SessionData | null>(null);

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/return/");

  useEffect(() => {
    if (isPublic) {
      return;
    }

    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch(
          "/api/auth/session",
          {
            cache: "no-store",
          }
        );

        if (
          response.status === 401
        ) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as SessionData;

        if (!cancelled) {
          setSession(data);
        }
      } catch {
        // El contenido principal ya tiene su
        // propia protección y manejo de errores.
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [isPublic, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  async function changeStore(
    storeId: number
  ) {
    const response = await fetch(
      "/api/context/store",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          storeId,
        }),
      }
    );

    if (!response.ok) {
      return;
    }

    setSession((current) =>
      current
        ? {
            ...current,
            activeStoreId:
              storeId,
          }
        : current
    );

    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  const activeStore =
    session?.stores?.find(
      (item) =>
        item.id ===
        session.activeStoreId
    ) ?? null;

  const company =
    session?.companies?.find(
      (item) =>
        item.companyId ===
        activeStore?.companyId
    ) ??
    session?.companies?.[0] ??
    null;

  const companyStores =
    session?.stores?.filter(
      (store) =>
        !company ||
        store.companyId ===
          company.companyId
    ) ?? [];

  const store =
    session?.stores?.find(
      (item) =>
        item.id ===
        session.activeStoreId
    ) ??
    companyStores[0] ??
    session?.stores?.[0] ??
    null;

  const roleLabel =
    company?.role === "OWNER"
      ? "Propietario"
      : company?.role === "ADMIN"
        ? "Administrador"
        : company?.role === "EMPLOYEE"
          ? "Empleado"
          : company?.role === "READ_ONLY"
            ? "Solo lectura"
            : "Cargando...";

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
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {company?.companyName ??
                  "Empresa"}
              </p>

              {session?.stores &&
              session.stores.length > 1 ? (
                <select
                  value={
                    store?.id ?? ""
                  }
                  onChange={(event) =>
                    void changeStore(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-white outline-none"
                >
                  {session.companies?.map(
                    (item) => {
                      const stores =
                        session.stores?.filter(
                          (candidate) =>
                            candidate.companyId ===
                            item.companyId
                        ) ?? [];

                      if (
                        stores.length === 0
                      ) {
                        return null;
                      }

                      return (
                        <optgroup
                          key={
                            item.companyId
                          }
                          label={
                            item.companyName
                          }
                        >
                          {stores.map(
                            (
                              candidate
                            ) => (
                              <option
                                key={
                                  candidate.id
                                }
                                value={
                                  candidate.id
                                }
                              >
                                {
                                  candidate.name
                                }
                              </option>
                            )
                          )}
                        </optgroup>
                      );
                    }
                  )}
                </select>
              ) : (
                <p className="mt-2 truncate text-sm font-medium">
                  {store?.name ??
                    "Sin tienda"}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-zinc-500">
                <span>
                  {store?.platform ??
                    "Sin plataforma"}
                </span>
                <span>
                  {roleLabel}
                </span>
              </div>

              {companyStores.length > 1 && (
                <p className="mt-2 text-xs text-zinc-600">
                  {companyStores.length} tiendas accesibles
                </p>
              )}
            </div>

            <div className="px-1">
              <p className="truncate text-xs text-zinc-600">
                {session?.user?.email ??
                  "Cargando usuario..."}
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
