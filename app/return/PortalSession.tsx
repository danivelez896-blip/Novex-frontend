"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { clearPortalAccess, hasPortalAccess, initializePortalAccess, PORTAL_AUTH_MESSAGE, PORTAL_AUTH_REQUIRED } from "@/lib/portal-authorization";

export default function PortalSession({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<{ path: string; ready: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const ready = initializePortalAccess(window.location, window.history);
    queueMicrotask(() => { if (!cancelled) setState({ path: pathname, ready }); });
    const expired = () => setState({ path: pathname, ready: false });
    const resume = () => setState({ path: pathname, ready: initializePortalAccess(window.location, window.history) });
    const hide = () => { clearPortalAccess(); expired(); };
    window.addEventListener(PORTAL_AUTH_REQUIRED, expired);
    window.addEventListener("pageshow", resume);
    window.addEventListener("hashchange", resume);
    window.addEventListener("pagehide", hide);
    const timer = window.setInterval(() => { if (!hasPortalAccess()) expired(); }, 1000);
    return () => {
      cancelled = true;
      window.removeEventListener(PORTAL_AUTH_REQUIRED, expired);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("hashchange", resume);
      window.removeEventListener("pagehide", hide);
      window.clearInterval(timer);
    };
  }, [pathname]);
  if (!state || state.path !== pathname) return <main className="min-h-screen bg-zinc-100 p-8 text-zinc-900" aria-busy="true">Preparando acceso seguro…</main>;
  if (!state.ready) return <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900"><section className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-semibold">Vuelve a abrir tu devolución</h1><p className="mt-4 text-sm text-zinc-600">{PORTAL_AUTH_MESSAGE}</p></section></main>;
  return children;
}
