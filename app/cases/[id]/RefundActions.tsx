 "use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Refund = {
  id: number;
  amount: string;
  currency: string;
  status: string;
  provider?: string | null;
  externalRefundId?: string | null;
};

export default function RefundActions({
  caseId,
  caseStatus,
  orderTotal,
  currency,
  refunds,
}: {
  caseId: number;
  caseStatus: string;
  orderTotal: string;
  currency: string;
  refunds: Refund[];
}) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const refund = refunds[0];

  async function createShopifyRefund() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/refunds/shopify/${caseId}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data?.message ??
            "No se pudo realizar el reembolso."
        );

        return;
      }

      setMessage(
        "Reembolso procesado correctamente mediante Shopify."
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "No se pudo conectar con Novex."
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    caseStatus !== "INSPECTION" &&
    !refund
  ) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-medium">
        Gestión del reembolso
      </h2>

      {!refund ? (
        <>
          <p className="mt-2 text-sm text-zinc-500">
            La inspección está abierta.
            Puedes devolver el importe
            correspondiente al cliente
            mediante Shopify.
          </p>

          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm text-zinc-500">
              Importe máximo del pedido
            </p>

            <p className="mt-1 text-xl font-semibold">
              {orderTotal} {currency}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Novex calculará automáticamente
              el importe correspondiente a los
              productos incluidos en esta
              devolución.
            </p>
          </div>

          <button
            type="button"
            onClick={createShopifyRefund}
            disabled={loading}
            className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading
              ? "Procesando reembolso..."
              : "Reembolsar mediante Shopify"}
          </button>
        </>
      ) : (
        <div className="mt-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm text-zinc-500">
              Importe
            </p>

            <p className="mt-1 text-xl font-semibold">
              {refund.amount}{" "}
              {refund.currency}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Estado
            </p>

            <p className="mt-1 text-sm">
              {refund.status}
            </p>

            {refund.provider && (
              <>
                <p className="mt-3 text-sm text-zinc-500">
                  Proveedor
                </p>

                <p className="mt-1 text-sm">
                  {refund.provider}
                </p>
              </>
            )}

            {refund.externalRefundId && (
              <>
                <p className="mt-3 text-sm text-zinc-500">
                  ID del reembolso
                </p>

                <p className="mt-1 break-all font-mono text-xs">
                  {refund.externalRefundId}
                </p>
              </>
            )}
          </div>

          {refund.status ===
            "PROCESSING" && (
            <p className="mt-4 text-sm text-amber-400">
              Shopify está procesando el
              reembolso.
            </p>
          )}

          {refund.status ===
            "COMPLETED" && (
            <span className="mt-4 inline-block rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              Reembolso completado
            </span>
          )}

          {refund.status === "FAILED" && (
            <span className="mt-4 inline-block rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">
              El reembolso ha fallado
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