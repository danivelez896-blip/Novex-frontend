import {
  getActiveStoreId,
  novexFetch,
} from "@/lib/novex-server";
import OrdersTable from "./OrdersTable";

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

async function getOrders(): Promise<Order[]> {
  const response = await novexFetch(
    "/orders"
  );

  if (!response.ok) {
    throw new Error(
      "No se pudieron cargar los pedidos"
    );
  }

  return response.json();
}

export default async function OrdersPage() {
  const [orders, activeStoreId] =
    await Promise.all([
      getOrders(),
      getActiveStoreId(),
    ]);

  const visibleOrders =
    activeStoreId
      ? orders.filter(
          (order) =>
            order.store?.id ===
            activeStoreId
        )
      : orders;

  const totalValue =
    visibleOrders.reduce(
      (sum, order) =>
        sum +
        (Number(
          order.totalAmount
        ) || 0),
      0
    );

  const now = Date.now();
  const last30Days =
    visibleOrders.filter(
      (order) =>
        now -
          new Date(
            order.orderedAt
          ).getTime() <=
        30 * 24 * 60 * 60 * 1000
    ).length;

  const currency =
    visibleOrders[0]?.currency ??
    "EUR";

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">
          Gestión
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Pedidos
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Pedidos sincronizados de la tienda activa.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Pedidos totales
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {visibleOrders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Últimos 30 días
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {last30Days}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Valor sincronizado
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {totalValue.toLocaleString(
              "es-ES",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}{" "}
            {currency}
          </p>
        </div>
      </div>

      <OrdersTable
        orders={visibleOrders}
      />
    </div>
  );
}
