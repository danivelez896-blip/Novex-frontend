"use client";

import { useState } from "react";

type Preview = {
  currency: string;
  originalTotal: number;
  replacementTotal: number;
  difference: number;
  action: string;
  lines: { variantTitle: string; title: string; quantity: number; stockAvailable: boolean }[];
  estimateOnly: boolean;
  note: string;
};
type Check = {
  status: string;
  readyForFurtherReview: boolean;
  existingReturns: { id: string; status: string }[];
  lines: { lineItemId: string | null; requestedQuantity: number; eligibleByFulfillment: boolean }[];
  execution: { status: string; externalReturnId?: string | null } | null;
  note: string;
};
type State<T> = { value?: T; error?: string; loading: boolean };
const initial = { loading: false };

export default function ExchangeReview({ caseId }: { caseId: number }) {
  const [preview, setPreview] = useState<State<Preview>>(initial);
  const [check, setCheck] = useState<State<Check>>(initial);

  async function load<T>(path: string, setter: (v: State<T>) => void) {
    setter({ loading: true });
    try {
      const response = await fetch(`/api/exchanges/cases/${caseId}/${path}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(
        Array.isArray(data.message) ? data.message.join(", ") : data.message || "Consulta fallida"
      );
      setter({ value: data, loading: false });
    } catch (error) {
      setter({ error: error instanceof Error ? error.message : "No disponible", loading: false });
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-violet-900/60 bg-zinc-900 p-6">
      <h2 className="text-lg font-medium">Seguimiento del cambio</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Consultas de solo lectura. No realizan pagos, devoluciones ni envíos.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={preview.loading} onClick={() => void load("preview", setPreview)}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm disabled:opacity-50">
          {preview.loading ? "Consultando…" : "Consultar diferencia de precio"}
        </button>
        <button type="button" disabled={check.loading} onClick={() => void load("check", setCheck)}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm disabled:opacity-50">
          {check.loading ? "Consultando…" : "Comprobar devolución en Shopify"}
        </button>
      </div>
      {preview.error && <p role="alert" className="mt-3 text-sm text-red-400">{preview.error}</p>}
      {preview.value && (
        <div className="mt-4 space-y-2 rounded-xl bg-zinc-950 p-4 text-sm">
          <p>Producto original: {preview.value.originalTotal} {preview.value.currency}</p>
          <p>Producto de sustitución: {preview.value.replacementTotal} {preview.value.currency}</p>
          <p className="font-medium">Diferencia estimada: {preview.value.difference} {preview.value.currency}</p>
          <p className="text-zinc-400">{preview.value.action === "CUSTOMER_PAYMENT_REQUIRED" ? "Requeriría un cobro posterior" : preview.value.action === "REFUND_REVIEW_REQUIRED" ? "Requeriría revisar un reembolso" : "Sin diferencia estimada"}</p>
          {preview.value.lines.map((item, index) => (
            <p key={index}>{item.title} · {item.variantTitle} × {item.quantity} · {item.stockAvailable ? "Disponible" : "Sin stock confirmado"}</p>
          ))}
          <p className="text-amber-300">Estimación sin impuestos, descuentos o costes de transporte definitivos. No se ha generado ningún movimiento económico.</p>
        </div>
      )}
      {check.error && <p role="alert" className="mt-3 text-sm text-red-400">{check.error}</p>}
      {check.value && (
        <div className="mt-4 space-y-2 rounded-xl bg-zinc-950 p-4 text-sm">
          <p>Estado del caso: {check.value.status}</p>
          <p>Estado de preparación: {check.value.execution?.status ?? "No preparado"}</p>
          <p>Envío original: {check.value.lines.every(x => x.eligibleByFulfillment) ? "Unidades enviadas detectadas" : "Sin unidades enviadas suficientes"}</p>
          <p>Devoluciones detectadas en Shopify: {check.value.existingReturns.length}</p>
          <p className="text-zinc-400">{check.value.note}</p>
        </div>
      )}
    </section>
  );
}
