import Link from "next/link";

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
  const response = await fetch(
    "https://novex-production-f614.up.railway.app/api/orders",
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("No se pudieron cargar los pedidos");
  }

  return response.json();
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Gestión</p>

        <h1 className="mt-1 text-3xl font-semibold">
          Pedidos
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Pedidos sincronizados con Novex
        </p>
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
                  Tienda
                </th>

                <th className="px-6 py-4 font-medium">
                  Importe
                </th>

                <th className="px-6 py-4 font-medium">
                  Fecha
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const customerName = order.customer
                  ? `${order.customer.firstName ?? ""} ${
                      order.customer.lastName ?? ""
                    }`.trim()
                  : "Sin cliente";

                return (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-800 transition hover:bg-zinc-800/50 last:border-b-0"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="block font-medium text-white"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="block"
                      >
                        <p>
                          {customerName || "Sin nombre"}
                        </p>

                        <p className="text-xs text-zinc-500">
                          {order.customer?.email ?? ""}
                        </p>
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="block text-zinc-300"
                      >
                        {order.store?.name ?? "-"}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="block"
                      >
                        {order.totalAmount} {order.currency}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="block text-zinc-400"
                      >
                        {new Date(
                          order.orderedAt
                        ).toLocaleDateString("es-ES")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}