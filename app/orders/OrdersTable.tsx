"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Order = {
  id: number;
  orderNumber: string;
  totalAmount: string;
  currency: string;
  orderedAt: string;
  customer?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  store?: {
    id: number;
    name: string;
  } | null;
};

type Period = "ALL" | "30" | "90";

export default function OrdersTable({
  orders,
}: {
  orders: Order[];
}) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] =
    useState<Period>("ALL");

  const filteredOrders = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();
    const now = Date.now();

    return orders.filter((order) => {
      const customerName = order.customer
        ? `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim()
        : "";

      const matchesQuery =
        !normalized ||
        order.orderNumber
          .toLowerCase()
          .includes(normalized) ||
        customerName
          .toLowerCase()
          .includes(normalized) ||
        (order.customer?.email ?? "")
          .toLowerCase()
          .includes(normalized);

      const days =
        period === "ALL"
          ? null
          : Number(period);

      const matchesPeriod =
        days === null ||
        now -
          new Date(
            order.orderedAt
          ).getTime() <=
          days * 24 * 60 * 60 * 1000;

      return (
        matchesQuery &&
        matchesPeriod
      );
    });
  }, [orders, query, period]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Buscar por pedido, cliente o email..."
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
        />

        <select
          value={period}
          onChange={(event) =>
            setPeriod(
              event.target
                .value as Period
            )
          }
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="ALL">
            Todas las fechas
          </option>
          <option value="30">
            Últimos 30 días
          </option>
          <option value="90">
            Últimos 90 días
          </option>
        </select>

        <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
          {filteredOrders.length} resultados
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-400">
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 font-medium">
                  Pedido
                </th>
                <th className="px-6 py-4 font-medium">
                  Cliente
                </th>
                <th className="px-6 py-4 font-medium">
                  Importe
                </th>
                <th className="px-6 py-4 font-medium">
                  Fecha
                </th>
                <th className="px-6 py-4 font-medium">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No hay pedidos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(
                  (order) => {
                    const customerName =
                      order.customer
                        ? `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim()
                        : "Sin cliente";

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-zinc-800 transition hover:bg-zinc-800/50 last:border-b-0"
                      >
                        <td className="px-6 py-4 font-medium">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4">
                          <p>
                            {customerName ||
                              "Sin nombre"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {order.customer
                              ?.email ?? ""}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {order.totalAmount}{" "}
                          {order.currency}
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(
                            order.orderedAt
                          ).toLocaleDateString(
                            "es-ES"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/orders/${order.id}`}
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
