"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CaseActions({
  caseId,
  currentStatus,
}: {
  caseId: number;
  currentStatus: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(status: string) {
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/cases/${caseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    });

    if (!response.ok) {
      setMessage("No se pudo actualizar el caso.");
      setLoading(false);
      return;
    }

    setMessage("Estado actualizado correctamente.");

    router.refresh();
    setLoading(false);
  }

  const canReview =
    currentStatus === "REQUESTED" ||
    currentStatus === "PENDING_REVIEW";

  const canInspect =
    currentStatus === "RECEIVED";

  const canClose =
    currentStatus === "REFUNDED" ||
    currentStatus === "REJECTED";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">
            Acciones del caso
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Estado actual: {currentStatus}
          </p>
        </div>

        {loading && (
          <span className="text-sm text-zinc-500">
            Actualizando...
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {canReview && (
          <>
            <button
              type="button"
              onClick={() => updateStatus("APPROVED")}
              disabled={loading}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:opacity-50"
            >
              Aprobar devolución
            </button>

            <button
              type="button"
              onClick={() => updateStatus("REJECTED")}
              disabled={loading}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              Rechazar devolución
            </button>
          </>
        )}

        {currentStatus === "APPROVED" && (
          <span className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-400">
            Pendiente de crear el envío de devolución
          </span>
        )}

        {currentStatus === "IN_TRANSIT" && (
          <span className="rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
            Producto en tránsito
          </span>
        )}

        {canInspect && (
          <button
            type="button"
            onClick={() => updateStatus("INSPECTION")}
            disabled={loading}
            className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-400 disabled:opacity-50"
          >
            Iniciar inspección
          </button>
        )}

        {currentStatus === "INSPECTION" && (
          <span className="rounded-xl bg-purple-500/10 px-4 py-2 text-sm text-purple-400">
            Producto en inspección
          </span>
        )}

        {canClose && (
          <button
            type="button"
            onClick={() => updateStatus("CLOSED")}
            disabled={loading}
            className="rounded-xl bg-zinc-200 px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:opacity-50"
          >
            Cerrar caso
          </button>
        )}

        {currentStatus === "CLOSED" && (
          <span className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-400">
            Caso cerrado
          </span>
        )}
      </div>

      {message && (
        <p className="mt-4 text-sm text-zinc-400">
          {message}
        </p>
      )}
    </section>
  );
}