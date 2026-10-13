"use client";

import { useState } from "react";

export default function StagingShopifyConnect({ storeId }: { storeId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}
