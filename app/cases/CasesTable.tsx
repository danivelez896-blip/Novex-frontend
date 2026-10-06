"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CaseItem = {
  id: number;
  storeId: number;
  status: string;
  requestedAt: string;
  customer?: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  order?: {
    orderNumber: string;
    totalAmount: string;
    currency: string;
  } | null;
};

const STATUS_OPTIONS = [
  "ALL",
  "PENDING_REVIEW",
  "APPROVED",
  "WAITING_CUSTOMER",
  "IN_TRANSIT",
  "RECEIVED",
  "INSPECTION",
  "REFUNDED",
  "REJECTED",
  "CLOSED",
  "CANCELLED",
];

function getStatusClasses(
  status: string
) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-500/10 text-emerald-400";
    case "PENDING_REVIEW":
      return "bg-amber-500/10 text-amber-400";
    case "REJECTED":
      return "bg-red-500/10 text-red-400";
    case "CLOSED":
      return "bg-zinc-700 text-zinc-200";
    case "REFUNDED":
      return "bg-blue-500/10 text-blue-400";
    case "INSPECTION":
      return "bg-purple-500/10 text-purple-400";
    case "RECEIVED":
      return "bg-cyan-500/10 text-cyan-400";
    case "IN_TRANSIT":
      return "bg-sky-500/10 text-sky-400";
    case "WAITING_CUSTOMER":
      return "bg-orange-500/10 text-orange-400";
    case "CANCELLED":
      return "bg-zinc-800 text-zinc-400";
    default:
      return "bg-zinc-800 text-zinc-300";
  }
}

function getStatusLabel(
  status: string
) {
  const labels: Record<string, string> = {
    PENDING_REVIEW: "Pendiente",
    APPROVED: "Aprobada",
    WAITING_CUSTOMER:
      "Esperando cliente",
    IN_TRANSIT: "En tránsito",
    RECEIVED: "Recibida",
    INSPECTION: "Inspección",
    REFUNDED: "Reembolsada",
    REJECTED: "Rechazada",
    CLOSED: "Cerrada",
    CANCELLED: "Cancelada",
  };

  return labels[status] ?? status;
}

export default function CasesTable({
  cases,
}: {
  cases: CaseItem[];
}) {
  const [query, setQuery] =
    useState("");
  const [status, setStatus] =
    useState("ALL");

  const filteredCases = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    return cases.filter((item) => {
      const customerName = item.customer
        ? `${item.customer.firstName ?? ""} ${item.customer.lastName ?? ""}`.trim()
        : "";

      const matchesQuery =
        !normalized ||
        String(item.id).includes(
          normalized
        ) ||
        customerName
          .toLowerCase()
          .includes(normalized) ||
        (item.customer?.email ?? "")
          .toLowerCase()
          .includes(normalized) ||
        (item.order?.orderNumber ?? "")
          .toLowerCase()
          .includes(normalized);

      const matchesStatus =
        status === "ALL" ||
        item.status === status;

      return (
        matchesQuery &&
        matchesStatus
      );
    });
  }, [cases, query, status]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          placeholder="Buscar por caso, cliente, email o pedido..."
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none"
        >
          {STATUS_OPTIONS.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option === "ALL"
                  ? "Todos los estados"
                  : getStatusLabel(
                      option
                    )}
              </option>
            )
          )}
        </select>

        <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
          {filteredCases.length} resultados
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-400">
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 font-medium">
                  Caso
                </th>
                <th className="px-6 py-4 font-medium">
                  Cliente
                </th>
                <th className="px-6 py-4 font-medium">
                  Pedido
                </th>
                <th className="px-6 py-4 font-medium">
                  Importe
                </th>
                <th className="px-6 py-4 font-medium">
                  Fecha
                </th>
                <th className="px-6 py-4 font-medium">
                  Estado
                </th>
                <th className="px-6 py-4 font-medium">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No hay devoluciones que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredCases.map(
                  (item) => {
                    const customerName =
                      item.customer
                        ? `${item.customer.firstName ?? ""} ${item.customer.lastName ?? ""}`.trim()
                        : "Sin cliente";

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-zinc-800 transition hover:bg-zinc-800/50 last:border-b-0"
                      >
                        <td className="px-6 py-4 font-medium">
                          #{item.id}
                        </td>

                        <td className="px-6 py-4">
                          <p>
                            {customerName ||
                              "Sin nombre"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {item.customer
                              ?.email ?? ""}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          {item.order
                            ?.orderNumber ??
                            "-"}
                        </td>

                        <td className="px-6 py-4">
                          {item.order
                            ? `${item.order.totalAmount} ${item.order.currency}`
                            : "-"}
                        </td>

                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(
                            item.requestedAt
                          ).toLocaleDateString(
                            "es-ES"
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {getStatusLabel(
                              item.status
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <Link
                            href={`/cases/${item.id}`}
                            className="inline-flex rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
