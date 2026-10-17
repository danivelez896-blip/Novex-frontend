"use client";

import { use, useEffect, useState } from "react";
import { portalFetch } from "@/lib/portal-authorization";
import ReturnRequestForm from "./ReturnRequestForm";

type PortalResponse = {
  order: {
    publicId: string;
    orderNumber: string;
    totalAmount: string;
    currency: string;
    orderedAt: string;
    customer?: {
      firstName: string | null;
      lastName: string | null;
    } | null;
    store: {
      id: number;
      name: string;
      platform: string;
    };
    items: {
      id: number;
      productName: string;
      variantName: string | null;
      sku: string | null;
      quantity: number;
      returnableQuantity: number;
      returnabilityReason: string | null;
      unitPrice: string;
      currency: string;
      isReturnable: boolean;
    }[];
  };
  rule: {
    returnDays: number;
    allowReturns: boolean;
    requirePhotos: boolean;
    rejectionMessage: string | null;
    customerConditions: string[];
    returnDeadline: string;
    withinReturnPeriod: boolean;
  } | null;
};

export default function ReturnPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [portal, setPortal] = useState<PortalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<string | undefined>();
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setDraft(new URLSearchParams(window.location.search).get("draft") ?? undefined);
    });
    void portalFetch(`/api/public/returns/orders/${encodeURIComponent(id)}`)
      .then(async response => response.ok ? response.json() as Promise<PortalResponse> : null)
      .then(data => { if (!cancelled) setPortal(data); })
      .catch(() => { if (!cancelled) setPortal(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);
  if (loading) return <main className="min-h-screen bg-zinc-100 p-8 text-zinc-900" aria-busy="true">Cargando tu pedido…</main>;

  if (!portal) {
    return (
      <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-xl">
          <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-semibold">
              Enlace de devolución no disponible
            </h1>

            <p className="mt-3 text-sm text-zinc-600">
              No hemos podido encontrar este pedido. Comprueba el enlace o contacta con la tienda si necesitas ayuda.
            </p>

            <p className="mt-6 text-xs text-zinc-400">
              Gestión de devoluciones mediante Novex
            </p>
          </section>
        </div>
      </main>
    );
  }

  const { order, rule } =
    portal;

  const customerName =
    order.customer
      ? `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim()
      : "Cliente";

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm text-zinc-500">
            {order.store.name}
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Solicitar una devolución
          </h1>

          <p className="mt-3 text-sm text-zinc-600">
            Hola {customerName || "Cliente"}, selecciona los productos que quieres devolver.
          </p>
        </div>

        {rule && (
          <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium">
              Condiciones de devolución
            </p>

            <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
              <p>
                Plazo: {rule.returnDays} días
              </p>
              <p>
                Fotos:{" "}
                {rule.requirePhotos
                  ? "Obligatorias"
                  : "No obligatorias"}
              </p>
            </div>

            {rule.customerConditions.length > 0 && (
              <div className="mt-4 border-t border-zinc-200 pt-4">
                <p className="text-sm font-medium text-zinc-700">
                  Otras condiciones
                </p>
                <ul className="mt-2 space-y-2 text-sm text-zinc-600">
                  {rule.customerConditions.map(
                    (condition) => (
                      <li
                        key={condition}
                        className="flex gap-2"
                      >
                        <span aria-hidden="true">
                          •
                        </span>
                        <span>
                          {condition}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </section>
        )}

        {!rule && (
          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-800">
              Esta tienda no tiene una regla de devolución activa.
            </p>
          </section>
        )}

        {rule &&
          (!rule.allowReturns ||
            !rule.withinReturnPeriod) && (
            <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-700">
                Este pedido no cumple las condiciones necesarias para realizar una devolución.
              </p>

              <p className="mt-2 text-sm text-red-600">
                Motivo:{" "}
                {!rule.allowReturns
                  ? rule.rejectionMessage ||
                    "La tienda no acepta devoluciones actualmente."
                  : "El plazo de devolución de este pedido ha finalizado."}
              </p>

              {rule.withinReturnPeriod === false &&
                rule.returnDeadline && (
                  <p className="mt-1 text-sm text-red-600">
                    Fecha límite:{" "}
                    {new Date(
                      rule.returnDeadline
                    ).toLocaleDateString(
                      "es-ES"
                    )}
                  </p>
                )}
            </section>
          )}

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Pedido
          </p>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium">
              {order.orderNumber}
            </p>

            <p className="text-sm text-zinc-500">
              {new Date(
                order.orderedAt
              ).toLocaleDateString(
                "es-ES"
              )}
            </p>
          </div>
        </section>

        <ReturnRequestForm
          orderPublicId={
            order.publicId
          }
          items={order.items}
          initialDraftToken={
            draft
          }
          rule={
            rule
              ? {
                  requirePhotos:
                    rule.requirePhotos,
                  allowReturns:
                    rule.allowReturns,
                  withinReturnPeriod:
                    rule.withinReturnPeriod,
                }
              : null
          }
        />

        <p className="mt-6 text-center text-xs text-zinc-400">
          Gestión de devoluciones mediante Novex
        </p>
      </div>
    </main>
  );
}
