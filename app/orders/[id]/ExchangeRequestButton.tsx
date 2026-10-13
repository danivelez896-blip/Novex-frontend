"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: number;
  storeId: number;
  customerId: number | null;
  orderItemId: number;
};

// Herramienta de prueba interna; hasta tener selector de variantes no se expone al público.
export default function ExchangeRequestButton({
  orderId, storeId, customerId, orderItemId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState("");
  const [kind, setKind] = useState<"EXCHANGE_SIZE" | "EXCHANGE_COLOR">("EXCHANGE_SIZE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function submit() {
    if (!confirmed) {
      setError("Confirma que has revisado la variante solicitada.");
      return;
    }
    if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variantId.trim())) {
      setError("Introduce el identificador de variante Shopify válido.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId, orderId, customerId: customerId ?? undefined,
          type: "EXCHANGE", resolutionType: kind,
          items: [{
            orderItemId, quantity: 1, reason: "Cambio solicitado",
            requestedVariant: variantId.trim(),
          }],
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message
          ? String(Array.isArray(data.message) ? data.message.join(", ") : data.message)
          : "No se pudo solicitar el cambio.");
      }
      const result = await response.json();
      router.push(`/cases/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al solicitar el cambio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-xl border border-zinc-600 px-5 py-3 text-sm text-white hover:border-zinc-400"
      >
        {open ? "Cancelar cambio" : "Solicitar cambio (prueba)"}
      </button>
      {open && (
        <div className="mt-3 max-w-lg space-y-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4">
          <p className="text-sm text-amber-300">
            Solo para pruebas internas. Requiere backend de exchanges desplegado.
            No genera envíos ni cobros.
          </p>
          <label className="block text-sm">
            Tipo de cambio
            <select className="mt-1 block w-full rounded-lg bg-zinc-800 p-2"
              value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="EXCHANGE_SIZE">Talla</option>
              <option value="EXCHANGE_COLOR">Color</option>
            </select>
          </label>
          <label className="block text-sm">
            ID de la nueva variante en Shopify
            <input className="mt-1 block w-full rounded-lg bg-zinc-800 p-2"
              value={variantId} onChange={(e) => setVariantId(e.target.value)}
              placeholder="gid://shopify/ProductVariant/123456789" />
          </label>
          <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm">
            <p className="font-medium">Resumen de la solicitud</p>
            <p className="mt-1 text-zinc-400">
              Cambio de {kind === "EXCHANGE_SIZE" ? "talla" : "color"} · 1 unidad
            </p>
            <p className="mt-1 break-all text-xs text-zinc-500">
              Variante destino: {variantId.trim() || "Sin seleccionar"}
            </p>
            <p className="mt-2 text-xs text-amber-300">
              La variante todavía se validará en el backend contra Shopify.
              No se realizará ningún envío ni cobro desde este formulario.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)} />
            He revisado los datos de esta solicitud de prueba.
          </label>
          <button type="button" disabled={loading || !confirmed || !variantId.trim()} onClick={submit}
            className="rounded-lg bg-white px-4 py-2 text-sm text-black disabled:opacity-50">
            {loading ? "Guardando..." : "Crear solicitud de prueba"}
          </button>
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
