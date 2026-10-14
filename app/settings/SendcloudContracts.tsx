"use client";

import { useState } from "react";

type Contract = { id?: number | string; name?: string; carrier?: string | { code?: string; name?: string }; is_active?: boolean };
function contractName(contract: Contract): string {
  if (typeof contract.name === "string" && contract.name.trim()) return contract.name;
  if (typeof contract.carrier === "string") return contract.carrier;
  if (contract.carrier && typeof contract.carrier === "object") {
    return contract.carrier.name || contract.carrier.code || "Contrato";
  }
  return "Contrato";
}
export default function SendcloudContracts({ storeId }: { storeId: number }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnMethods, setReturnMethods] = useState<{ id: number | null; name: string; minWeight: unknown; maxWeight: unknown }[]>([]);
  const [returnMessage, setReturnMessage] = useState("");
  async function loadReturnMethods() {
    setReturnLoading(true);
    setReturnMessage("");
    try {
      const response = await fetch(`/api/integrations/sendcloud/stores/${storeId}/return-methods`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudieron consultar los métodos");
      setReturnMethods(Array.isArray(data.methods) ? data.methods : []);
      if (!data.methods?.length) setReturnMessage("No hay métodos Correos visibles en esta consulta.");
    } catch (error) {
      setReturnMessage(error instanceof Error ? error.message : "Error de consulta");
    } finally {
      setReturnLoading(false);
    }
  }
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
      <div className="mt-4 border-t border-zinc-800 pt-4">
        <p className="text-sm font-medium">Métodos Correos de devolución (diagnóstico)</p>
        <p className="mt-1 text-xs text-zinc-400">
          Consulta de la API v2, solo para identificar el servicio. Sus identificadores NO son códigos de la API v3.
        </p>
        <button type="button" onClick={() => void loadReturnMethods()} disabled={returnLoading}
          className="mt-3 rounded-lg border border-zinc-600 px-4 py-2 text-sm disabled:opacity-50">
          {returnLoading ? "Consultando…" : "Consultar métodos Correos de retorno"}
        </button>
        {returnMessage && <p role="status" className="mt-2 text-sm text-amber-300">{returnMessage}</p>}
        {returnMethods.map((method, index) => (
          <div key={String(method.id ?? index)} className="mt-2 rounded-lg border border-zinc-800 p-3 text-sm">
            {method.name} · ID v2: {String(method.id ?? "—")}
            <span className="ml-2 text-xs text-zinc-500">
              {String(method.minWeight ?? "?")}–{String(method.maxWeight ?? "?")} kg
            </span>
          </div>
        ))}
      </div>
      {message && <p role="status" className="mt-3 text-xs text-amber-300">{message}</p>}
      {contracts.length > 0 && <div className="mt-4 space-y-2">
        {contracts.map((contract, index) => <div key={String(contract.id ?? index)}
          className="rounded-lg border border-zinc-800 p-3 text-sm">
          <p>{contractName(contract)} · ID {String(contract.id ?? "no disponible")}</p>
        </div>)}
        <p className="text-xs text-amber-300">Aún no se ha elegido ni guardado un método de devolución. Validaremos destino, peso y opciones de envío antes de habilitarlo.</p>
      </div>}
    </div>
  );
}
