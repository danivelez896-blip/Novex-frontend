"use client";
import { useState } from "react";
type Inspection = { readyForRemoteValidation: boolean; message?: string; weightKg: number; contractId?: number; shippingOptionCode?: string; note?: string };
export default function ReturnPreflight({ caseId }: { caseId: number }) {
  const [result, setResult] = useState<Inspection | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState("");
  async function validate() {
    setValidating(true); setValidation("");
    try {
      const response = await fetch("/api/shipments/sendcloud/validate-return", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId }),
      });
      const data = await response.json();
      if (!response.ok) {
        const details = data?.message;
        throw new Error(typeof details === "string" ? details : "Sendcloud rechazó la validación");
      }
      setValidation("Sendcloud ha validado los datos. No se ha creado ninguna etiqueta.");
    } catch (e) {
      setValidation(e instanceof Error ? e.message : "Error al validar");
    } finally { setValidating(false); }
  }
  async function inspect() {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/shipments/sendcloud/inspect-return/${caseId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "Error en la comprobación");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo comprobar");
    } finally { setLoading(false); }
  }
  return <section className="mt-5 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
    <h3 className="text-base font-medium">Comprobación logística de devolución</h3>
    <p className="mt-1 text-sm text-zinc-400">Diagnóstico local para 0,4 kg. No genera etiquetas ni contacta con el transportista.</p>
    <button type="button" disabled={loading} onClick={() => void inspect()}
      className="mt-3 rounded-lg border border-zinc-600 px-4 py-2 text-sm cursor-pointer transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50">
      {loading ? "Comprobando…" : "Comprobar datos del envío"}
    </button>
    {result?.readyForRemoteValidation && <div className="mt-4">
      <button type="button" disabled={validating} onClick={() => void validate()}
        className="cursor-pointer rounded-lg border border-violet-700 px-4 py-2 text-sm transition-colors hover:bg-violet-950 focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50">
        {validating ? "Validando…" : "Validar devolución con Sendcloud"}
      </button>
      <p className="mt-2 text-xs text-zinc-400">Validación remota de 0,4 kg. No anuncia ni crea una devolución.</p>
      {validation && <p role="status" className="mt-2 text-sm text-amber-300">{validation}</p>}
    </div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
    {result && <div className="mt-3 space-y-1 text-sm">
      <p className={result.readyForRemoteValidation ? "text-emerald-400" : "text-amber-300"}>
        {result.readyForRemoteValidation ? "Datos locales completos" : "Faltan datos para la devolución"}
      </p>
      {result.message && <p>{result.message}</p>}
      {result.contractId && <p>Contrato: {result.contractId}</p>}
      {result.shippingOptionCode && <p>Método: {result.shippingOptionCode}</p>}
      <p className="text-zinc-400">{result.note}</p>
    </div>}
  </section>;
}
