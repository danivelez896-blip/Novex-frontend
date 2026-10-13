"use client";

import { useState } from "react";

type Contract = { id?: number | string; name?: string; carrier?: string; is_active?: boolean };
export default function SendcloudContracts({ storeId }: { storeId: number }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/integrations/sendcloud/stores/${storeId}/contracts`, { cache: "no-store" });
      if (!response.ok) throw new Error("Sendcloud no ha permitido consultar los contratos");
      const result: unknown = await response.json();
      const obj = result && typeof result === "object" ? result as Record<string, unknown> : {};
      const values = Array.isArray(result) ? result :
        Array.isArray(obj.data) ? obj.data :
        Array.isArray(obj.contracts) ? obj.contracts : [];
      const safe = values.filter((v): v is Contract => v !== null && typeof v === "object");
      setContracts(safe);
      if (!safe.length) setMessage("La API no ha devuelto contratos activos o utiliza un formato inesperado. No se ha modificado nada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No disponible");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-4">
      <p className="text-sm font-medium">Contratos de transporte de Sendcloud</p>
      <p className="mt-2 text-xs text-zinc-400">Consulta de solo lectura. No crea etiquetas ni modifica el contrato.</p>
      <button type="button" onClick={() => void load()} disabled={loading}
        className="mt-3 rounded-lg border border-zinc-600 px-4 py-2 text-sm disabled:opacity-50">
        {loading ? "Consultando…" : "Consultar contratos activos"}
      </button>
      {message && <p role="status" className="mt-3 text-xs text-amber-300">{message}</p>}
      {contracts.length > 0 && <div className="mt-4 space-y-2">
        {contracts.map((contract, index) => <div key={String(contract.id ?? index)}
          className="rounded-lg border border-zinc-800 p-3 text-sm">
          <p>{contract.name || contract.carrier || "Contrato"} · ID {String(contract.id ?? "no disponible")}</p>
        </div>)}
        <p className="text-xs text-amber-300">Aún no se ha elegido ni guardado un método de devolución. Validaremos destino, peso y opciones de envío antes de habilitarlo.</p>
      </div>}
    </div>
  );
}
