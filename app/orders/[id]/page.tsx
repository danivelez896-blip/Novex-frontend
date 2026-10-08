import ReturnRequestButton from "./ReturnRequestButton";

import Link from "next/link";

import { novexFetch } from "@/lib/novex-server";

type OrderDetail = {
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
    phone: string | null;
  } | null;

  store?: {
    id: number;
    name: string;
    platform: string;
  } | null;

  items?: {
    id: number;
    productName: string;
    variantName: string | null;
    sku: string | null;
    quantity: number;
    unitPrice: string;
    currency: string;
    isReturnable?: boolean;
  }[];
};

async function getOrder(id: string): Promise<OrderDetail> {
  const response = await novexFetch(
    `/orders/${id}`
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar el pedido");
  }

  return response.json();
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  const customerName = order.customer
    ? `${order.customer.firstName ?? ""} ${
        order.customer.lastName ?? ""
      }`.trim()
    : "Sin cliente";

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <Link
          href="/orders"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← Volver a pedidos
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm text-zinc-400">Pedido</p>

        <h1 className="mt-1 text-3xl font-semibold">
          {order.orderNumber}
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Pedido #{order.id}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-medium">Cliente</h2>

          <div className="mt-5 space-y-2 text-sm">
            <p>{customerName}</p>

            <p className="text-zinc-400">
              {order.customer?.email ?? "-"}
            </p>

            <p className="text-zinc-400">
              {order.customer?.phone ?? "-"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-medium">Información del pedido</h2>

          <div className="mt-5 space-y-3 text-sm">
            <div>
              <p className="text-zinc-500">Importe total</p>

              <p className="mt-1 text-lg font-medium">
                {order.totalAmount} {order.currency}
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Fecha</p>

              <p className="mt-1">
                {new Date(order.orderedAt).toLocaleDateString("es-ES")}
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Tienda</p>

              <p className="mt-1">
                {order.store?.name ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Plataforma</p>

              <p className="mt-1">
                {order.store?.platform ?? "-"}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">Productos</h2>

        {!order.items || order.items.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            Este pedido no tiene productos.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {item.productName}
                    </p>

                    <p className="mt-1 text-sm text-zinc-400">
                      {item.variantName ?? "Sin variante"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      SKU: {item.sku ?? "-"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm">
                      {item.unitPrice} {item.currency}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                </div>

                {item.isReturnable !== undefined && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        item.isReturnable
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {item.isReturnable
                        ? "Admite devolución"
                        : "No admite devolución"}
                    </span>
                  </div>
                )}
                {item.isReturnable && (
  <ReturnRequestButton
    orderId={order.id}
    storeId={order.store?.id ?? 0}
    customerId={order.customer?.id ?? null}
    orderItemId={item.id}
  />
)}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}