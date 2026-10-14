"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StagingReturnSimulation({
  caseId, status, isSimulation,
}: { caseId: number; status: string; isSimulation: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const action = status === "APPROVED" ? "CREATE" :
    status === "IN_TRANSIT" && isSimulation ? "RECEIVE" : null;
  async function proceed() {
    if (!action) return;
    const label = action === "CREATE" ? "crear un envío ficticio" : "simular la recepción del paquete";
    if (!window.confirm(`¿Confirmas que quieres ${label} en Staging? No existe ningún transporte real.`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/shipments/staging/simulate-exchange-return", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, action }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(
        typeof data?.message === "string" ? data.message : "No se pudo realizar la simulación");
      setMessage("Simulación registrada. No se ha contratado transporte.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error de simulación");
    } finally { setBusy(false); }
  }
  return <section className="mt-5 rounded-xl border border-dashed border-amber-700/70 bg-zinc-950 p-4">
    <h3 className="text-base font-medium">Laboratorio de devolución · Solo Staging</h3>
    <p className="mt-1 text-sm text-amber-300">Simulación ficticia. No crea etiquetas ni comunica envíos a Sendcloud o Shopify.</p>
    {action ? <button type="button" onClick={() => void proceed()} disabled={busy}
      className="mt-3 cursor-pointer rounded-lg border border-amber-600 px-4 py-2 text-sm transition hover:bg-amber-950 focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50">
      {busy ? "Simulando…" : action === "CREATE" ? "Simular envío de devolución" : "Simular recepción en tienda"}
    </button> :
      <p className="mt-3 text-sm text-zinc-400">No hay ninguna acción de simulación disponible en este estado.</p>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </section>;
}
