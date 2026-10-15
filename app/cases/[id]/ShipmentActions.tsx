"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { areRealEconomicActionsEnabled } from "@/lib/economic-actions";

type Shipment = {
  id: number;
  status: string;
  carrier?: string | null;
  shippingProvider?: string | null;
  externalShipmentId?: string | null;
  externalReturnId?: string | null;
  trackingNumber?: string | null;
  labelUrl?: string | null;
  qrCodeUrl?: string | null;
  providerStatus?: string | null;
  providerStatusUpdatedAt?: string | null;
};

const realEconomicActionsEnabled =
  areRealEconomicActionsEnabled(
    process.env.NEXT_PUBLIC_ENABLE_REAL_ECONOMIC_ACTIONS
  );

export default function ShipmentActions({
  caseId,
  caseStatus,
  shipments,
}: {
  caseId: number;
  caseStatus: string;
  shipments: Shipment[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const shipment = shipments[0];

  async function createShipment() {
    if (!realEconomicActionsEnabled) {
      setMessage(
        "Envío real bloqueado en este entorno. Se habilitará solo durante la validación final autorizada."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/shipments/sendcloud/create-return",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            caseId,
            weight: 0.5,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data?.message ??
            "No se pudo crear el envío."
        );
        return;
      }

      setMessage(
        "Devolución creada correctamente con Sendcloud."
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("No se pudo conectar con Novex.");
    } finally {
      setLoading(false);
    }
  }

  if (caseStatus !== "APPROVED" && !shipment) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-medium">
        Logística de devolución
      </h2>

      {!shipment ? (
        <>
          <p className="mt-2 text-sm text-zinc-500">
            La devolución logística se prepara
            aquí. Las compras reales de etiquetas
            permanecen bloqueadas en staging.
          </p>

          {!realEconomicActionsEnabled && (
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">
              Envío real desactivado. Esta
              interfaz no comprará ninguna
              etiqueta en Sendcloud.
            </p>
          )}

          <button
            type="button"
            onClick={createShipment}
            disabled={
              loading ||
              !realEconomicActionsEnabled
            }
            className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Creando devolución..."
              : realEconomicActionsEnabled
                ? "Crear envío de devolución"
                : "Envío real bloqueado"}
          </button>
        </>
      ) : (
        <div className="mt-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm text-zinc-500">Transportista</p>
            <p className="mt-1">{shipment.carrier ?? "-"}</p>

            {shipment.shippingProvider && (
              <>
                <p className="mt-4 text-sm text-zinc-500">
                  Proveedor logístico
                </p>
                <p className="mt-1">{shipment.shippingProvider}</p>
              </>
            )}

            <p className="mt-4 text-sm text-zinc-500">Tracking</p>
            <p className="mt-1 break-all font-mono text-sm">
              {shipment.trackingNumber ?? "-"}
            </p>

            <p className="mt-4 text-sm text-zinc-500">Estado Novex</p>
            <p className="mt-1">{shipment.status}</p>

            {shipment.providerStatus && (
              <>
                <p className="mt-4 text-sm text-zinc-500">
                  Estado del transportista
                </p>
                <p className="mt-1">{shipment.providerStatus}</p>
              </>
            )}

            {shipment.externalReturnId && (
              <>
                <p className="mt-4 text-sm text-zinc-500">
                  ID devolución Sendcloud
                </p>
                <p className="mt-1 font-mono text-sm">
                  {shipment.externalReturnId}
                </p>
              </>
            )}
          </div>

          {shipment.shippingProvider === "SENDCLOUD" && (
            <p className="mt-4 text-sm text-zinc-500">
              El estado del envío se actualiza
              automáticamente mediante Sendcloud.
            </p>
          )}

          {shipment.status === "DELIVERED" && (
            <span className="mt-3 inline-block rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              Producto recibido
            </span>
          )}
        </div>
      )}

      {message && (
        <p className="mt-4 text-sm text-zinc-400">
          {message}
        </p>
      )}
    </section>
  );
}
