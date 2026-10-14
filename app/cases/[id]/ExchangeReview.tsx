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
  const [readiness, setReadiness] = useState<State<{
    safeToExecute: boolean;
    blockers: string[];
    shopifyMutationPerformed: boolean;
  }>>(initial);
  const [preparing, setPreparing] = useState(false);
  const [prepared, setPrepared] = useState<{ status: string; executionId: number } | null>(null);
  const [prepareMessage, setPrepareMessage] = useState("");
  const [simulatingReplacement, setSimulatingReplacement] = useState(false);
  const [replacementMessage, setReplacementMessage] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [finishMessage, setFinishMessage] = useState("");
  async function finishSimulation() {
    if (!window.confirm("Finalizar solo la simulación? El caso real seguirá en INSPECTION.")) return;
    setFinishing(true); setFinishMessage("");
    try {
      const response = await fetch(`/api/exchanges/cases/${caseId}/finish-simulation`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "No se pudo finalizar");
      setFinishMessage(data.alreadyRegistered ? "Ya estaba finalizada, sin duplicados." : "Simulación finalizada. El cambio real sigue pendiente.");
    } catch (error) {
      setFinishMessage(error instanceof Error ? error.message : "Error");
    } finally { setFinishing(false); }
  }
  async function simulateReplacement() {
    if (!window.confirm("¿Registrar solo la planificación ficticia de la nueva talla? No se creará pedido, reserva de stock ni envío en Shopify.")) return;
    setSimulatingReplacement(true);
    setReplacementMessage("");
    try {
      const response = await fetch(`/api/exchanges/cases/${caseId}/simulate-replacement`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(
        Array.isArray(data.message) ? data.message.join(", ") :
        typeof data.message === "string" ? data.message : "No se pudo simular");
      setReplacementMessage(data.alreadyRegistered
        ? "Esta planificación ya estaba registrada. No hay duplicados."
        : "Sustitución planificada ficticiamente. Shopify no se ha modificado.");
    } catch (error) {
      setReplacementMessage(error instanceof Error ? error.message : "Error de simulación");
    } finally { setSimulatingReplacement(false); }
  }
  async function prepare() {
    if (!window.confirm("¿Preparar el cambio solo dentro de Novex Staging? No crea devoluciones, productos ni envíos en Shopify.")) return;
    setPreparing(true);
    setPrepareMessage("");
    try {
      const response = await fetch(`/api/exchanges/cases/${caseId}/prepare`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "No se pudo preparar el cambio");
      setPrepared(data);
      setPrepareMessage("Preparación local registrada. No se ha modificado Shopify.");
    } catch (e) {
      setPrepareMessage(e instanceof Error ? e.message : "Error de preparación");
    } finally { setPreparing(false); }
  }

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
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm cursor-pointer transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50">
          {preview.loading ? "Consultando…" : "Consultar diferencia de precio"}
        </button>
        <button type="button" disabled={check.loading} onClick={() => void load("check", setCheck)}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm cursor-pointer transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50">
          {check.loading ? "Consultando…" : "Comprobar devolución en Shopify"}
        </button>
      </div>
      {check.value?.status === "INSPECTION" && (
        <div className="mt-4 rounded-xl border border-dashed border-violet-700 p-4">
          <h3 className="font-medium">Preparación interna del cambio</h3>
          <p className="mt-1 text-sm text-zinc-400">Registra una operación idempotente en Novex; no modifica Shopify ni crea envíos.</p>
          <button type="button" onClick={() => void prepare()} disabled={preparing}
            className="mt-3 cursor-pointer rounded-lg border border-violet-500 px-4 py-2 text-sm transition hover:bg-violet-950 focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50">
            {preparing ? "Preparando…" : "Preparar cambio en Novex"}
          </button>
          {prepared && <p className="mt-2 text-sm text-emerald-400">Ejecución #{prepared.executionId}: {prepared.status}</p>}
          {prepareMessage && <p role="status" className="mt-2 text-sm text-amber-300">{prepareMessage}</p>}
        </div>
      )}
      {check.value?.status === "INSPECTION" &&
        (prepared?.status === "PREPARED" || check.value.execution?.status === "PREPARED") && (
        <div className="mt-4 rounded-xl border border-dashed border-amber-700/70 p-4">
          <h3 className="font-medium">Simulación de producto de sustitución · Solo Staging</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Comprueba de nuevo stock y precio en Shopify (solo lectura) y registra una planificación interna sin alterar la ejecución preparada.
          </p>
          <button type="button" disabled={simulatingReplacement} onClick={() => void simulateReplacement()}
            className="mt-3 cursor-pointer rounded-lg border border-amber-600 px-4 py-2 text-sm transition hover:bg-amber-950 focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50">
            {simulatingReplacement ? "Comprobando…" : "Simular preparación de la talla de sustitución"}
          </button>
          {replacementMessage && <p role="status" className="mt-3 text-sm text-amber-300">{replacementMessage}</p>}
        </div>
      )}
      {check.value?.status === "INSPECTION" &&
        (prepared?.status === "PREPARED" || check.value.execution?.status === "PREPARED") && (
        <div className="mt-4 rounded-xl border border-dashed border-amber-800 p-4">
          <h3 className="font-medium">Cierre del laboratorio · Solo Staging</h3>
          <p className="mt-1 text-sm text-zinc-400">Finaliza solo la prueba ficticia, no el cambio real.</p>
          <button type="button" disabled={finishing} onClick={() => void finishSimulation()}
            className="mt-3 cursor-pointer rounded-lg border border-amber-600 px-4 py-2 text-sm transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-50">
            {finishing ? "Finalizando…" : "Finalizar simulación de cambio"}
          </button>
          {finishMessage && <p role="status" className="mt-3 text-sm text-amber-300">{finishMessage}</p>}
        </div>
      )}
      <div className="mt-4 rounded-xl border border-zinc-700 p-4">
        <h3 className="font-medium">Diagnóstico previo a un cambio real</h3>
        <p className="mt-1 text-sm text-zinc-400">Solo lectura. Muestra los bloqueos antes de cualquier operación real.</p>
        <button type="button" disabled={readiness.loading}
          onClick={() => void load("readiness", setReadiness)}
          className="mt-3 cursor-pointer rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50">
          {readiness.loading ? "Verificando…" : "Analizar seguridad del cambio"}
        </button>
        {readiness.error && <p role="alert" className="mt-3 text-sm text-red-400">{readiness.error}</p>}
        {readiness.value && <div className="mt-3 text-sm">
          <p className={readiness.value.safeToExecute ? "text-emerald-400" : "text-amber-300"}>
            {readiness.value.safeToExecute ? "Sin bloqueos detectados (no constituye autorización de ejecución)." : "Ejecución real bloqueada"}
          </p>
          {readiness.value.blockers.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">
            {readiness.value.blockers.map((reason, index) => <li key={index}>{reason}</li>)}
          </ul>}
          <p className="mt-2 text-zinc-400">No se han realizado modificaciones en Shopify.</p>
        </div>}
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
