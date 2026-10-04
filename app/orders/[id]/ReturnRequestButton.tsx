"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReturnRequestButton({
  orderId,
  storeId,
  customerId,
  orderItemId,
}: {
  orderId: number;
  storeId: number;
  customerId: number | null;
  orderItemId: number;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createReturn() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/cases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storeId,
        orderId,
        customerId,
        type: "RETURN",
        items: [
          {
            orderItemId,
            quantity: 1,
            reason: "Talla incorrecta",
            customerComment:
              "Solicitud creada desde el panel de Novex",
          },
        ],
      }),
    });

    if (!response.ok) {
      setMessage("No se pudo crear la devolución.");
      setLoading(false);
      return;
    }

    const newCase = await response.json();

    router.push(`/cases/${newCase.id}`);
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={createReturn}
        disabled={loading}
        className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {loading ? "Creando devolución..." : "Solicitar devolución"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-red-400">
          {message}
        </p>
      )}
    </div>
  );
}