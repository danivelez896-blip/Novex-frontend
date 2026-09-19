 "use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Refund = {
  id: number;
  amount: string;
  currency: string;
  status: string;
  provider?: string | null;
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

  const [amount, setAmount] = useState(orderTotal);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const refund = refunds[0];

  async function createRefund() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseId,
          amount: Number(amount),
          currency,
          provider: "Demo",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data?.message ??
            "No se pudo crear el reembolso."
        );
        setLoading(false);
        return;
      }

      setMessage(
        "Reembolso creado correctamente."
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

  if (caseStatus !== "INSPECTION" && !refund) {
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
            La inspección está abierta. Puedes
            iniciar el reembolso del pedido.
          </p>

          <div className="mt-5 max-w-xs">
            <label className="text-sm text-zinc-400">
              Importe a reembolsar
            </label>

            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                max={orderTotal}
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                className="w-40 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500"
              />

              <span className="text-sm text-zinc-400">
                {currency}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={createRefund}
            disabled={loading}
            className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading
              ? "Creando..."
              : "Iniciar reembolso"}
          </button>
        </>
      ) : (
        <div className="mt-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm text-zinc-500">
              Importe
            </p>

            <p className="mt-1 text-xl font-semibold">
              {refund.amount} {refund.currency}
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
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            El estado del reembolso se actualizará
            automáticamente cuando esté conectado
            el proveedor de pagos.
          </p>

          {refund.status === "COMPLETED" && (
            <span className="mt-3 inline-block rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              Reembolso completado
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