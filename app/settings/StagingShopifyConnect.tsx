"use client";

import { useState } from "react";

export default function StagingShopifyConnect({ storeId }: { storeId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auditing, setAuditing] = useState(false);
  const [scopeResult, setScopeResult] = useState<{ hasWriteReturns: boolean; hasReadReturns: boolean; shopDomain: string } | null>(null);
  const [scopeError, setScopeError] = useState("");
  async function auditScopes() {
    setAuditing(true); setScopeError("");
    try {
      const response = await fetch(`/api/integrations/shopify/staging-scopes/${storeId}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(
        typeof body.message === "string" ? body.message : "No se pudo verificar Shopify");
      setScopeResult(body);
    } catch (error) {
      setScopeError(error instanceof Error ? error.message : "No disponible");
    } finally { setAuditing(false); }
  }
  async function connect() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/integrations/shopify/staging-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || typeof body?.authorizationUrl !== "string") {
        throw new Error(body?.message ?? "No se pudo iniciar la conexión");
      }
      window.location.assign(body.authorizationUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error de conexión");
      setLoading(false);
    }
  }
  return (
    <div className="mt-4">
      <p className="mb-3 text-xs text-amber-300">
        Solo Staging · Autoriza exclusivamente novex-dev.myshopify.com.
        No ejecutes operaciones reales de pedidos o reembolsos.
      </p>
      <button type="button" disabled={loading} onClick={() => void connect()}
        className="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50">
        {loading ? "Conectando…" : "Conectar Shopify Staging"}
      </button>
      <div className="mt-4 rounded-lg border border-zinc-700 p-4">
        <p className="text-sm font-medium">Auditoría de permisos concedidos por Shopify (solo lectura)</p>
        <button type="button" onClick={() => void auditScopes()} disabled={auditing}
          className="mt-3 cursor-pointer rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50">
          {auditing ? "Verificando…" : "Verificar permiso write_returns"}
        </button>
        {scopeResult && <p className={`mt-3 text-sm ${scopeResult.hasWriteReturns ? "text-emerald-400" : "text-amber-300"}`}>
          {scopeResult.shopDomain}: read_returns {scopeResult.hasReadReturns ? "concedido" : "no concedido"} ·
          write_returns {scopeResult.hasWriteReturns ? "concedido" : "no concedido"}
        </p>}
        {scopeError && <p role="alert" className="mt-3 text-sm text-red-400">{scopeError}</p>}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}
