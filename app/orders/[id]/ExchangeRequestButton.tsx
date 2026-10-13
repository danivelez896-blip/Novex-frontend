"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Variant = { id: string; title: string; price: string; availableForSale: boolean; options: { name: string; value: string }[] };
type VariantResponse = { originalVariantId: string; variants: Variant[] };

type Props = {
  orderId: number;
  storeId: number;
  customerId: number | null;
  orderItemId: number;
  maxQuantity: number;
};

// Herramienta de prueba interna; hasta tener selector de variantes no se expone al público.
export default function ExchangeRequestButton({
  orderId, storeId, customerId, orderItemId, maxQuantity,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState("");
  const [kind, setKind] = useState<"EXCHANGE_SIZE" | "EXCHANGE_COLOR">("EXCHANGE_SIZE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [originalVariantId, setOriginalVariantId] = useState("");
  const [optionsReady, setOptionsReady] = useState(false);

  async function loadOptions() {
    setOpen(true);
    if (optionsReady || loadingOptions) return;
    setLoadingOptions(true);
    setError("");
    try {
      const response = await fetch(`/api/exchanges/order-items/${orderItemId}/variants`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "No se pudieron cargar las variantes");
      const result = data as VariantResponse;
      setOriginalVariantId(result.originalVariantId);
      setVariants(result.variants);
      setOptionsReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando variantes");
    } finally {
      setLoadingOptions(false);
    }
  }

  async function submit() {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
      setError("La cantidad solicitada no es válida.");
      return;
    }
    if (!optionsReady || !variants.some(v => v.id === variantId && v.availableForSale && v.id !== originalVariantId)) {
      setError("Selecciona una variante disponible distinta de la original.");
      return;
    }
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
            orderItemId, quantity, reason: "Cambio solicitado",
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
        onClick={() => { if (open) setOpen(false); else void loadOptions(); }}
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
              value={kind} onChange={(e) => { setKind(e.target.value as typeof kind); setVariantId(""); setConfirmed(false); }}>
              <option value="EXCHANGE_SIZE">Talla</option>
              <option value="EXCHANGE_COLOR">Color</option>
            </select>
          </label>
          <label className="block text-sm">
            Nueva variante
            <select
              value={variantId}
              onChange={(e) => { setVariantId(e.target.value); setConfirmed(false); }}
              disabled={!optionsReady || loadingOptions}
              className="mt-1 block w-full rounded-lg bg-zinc-800 p-2"
            >
              <option value="">{loadingOptions ? "Cargando variantes…" : "Selecciona talla y color"}</option>
              {variants.filter(v => v.id !== originalVariantId).map(v => (
                <option key={v.id} value={v.id} disabled={!v.availableForSale}>
                  {v.options.map(o => `${o.name}: ${o.value}`).join(" / ") || v.title}
                  {" · "}{v.price} €{!v.availableForSale ? " · No disponible" : ""}
                </option>
              ))}
            </select>
          </label>
          {optionsReady && variants.length <= 1 && (
            <p className="text-sm text-amber-300">No hay otras variantes disponibles para este artículo.</p>
          )}
          <label className="block text-sm">
            Unidades que quieres cambiar
            <input type="number" min={1} max={maxQuantity} step={1}
              value={quantity} onChange={(e) => { setQuantity(Number(e.target.value)); setConfirmed(false); }}
              className="mt-1 block w-full rounded-lg bg-zinc-800 p-2" />
          </label>
          <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm">
            <p className="font-medium">Resumen de la solicitud</p>
            <p className="mt-1 text-zinc-400">
              Cambio de {kind === "EXCHANGE_SIZE" ? "talla" : "color"} · {quantity} {quantity === 1 ? "unidad" : "unidades"}
            </p>
            <p className="mt-1 break-all text-xs text-zinc-500">
              Variante destino: {variants.find(v => v.id === variantId)?.title || "Sin seleccionar"}
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
