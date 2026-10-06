import Link from "next/link";

const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

type PortalResponse = {
  order: {
    publicId: string;
    orderNumber: string;
    totalAmount: string;
    currency: string;
    orderedAt: string;
    customer?: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
    store: {
      id: number;
      name: string;
      platform: string;
    };
    items: {
      id: number;
      productName: string;
      variantName: string | null;
      sku: string | null;
      quantity: number;
      unitPrice: string;
      currency: string;
      isReturnable: boolean;
    }[];
  };
  rule: {
    returnDays: number;
    allowReturns: boolean;
    allowRefund: boolean;
    allowSizeExchange: boolean;
    allowColorExchange: boolean;
    allowProductExchange: boolean;
    requirePhotos: boolean;
    autoApprove: boolean;
    rejectionMessage: string | null;
    isActive: boolean;
    returnDeadline: string;
    withinReturnPeriod: boolean;
  } | null;
};

async function getPortal(
  publicId: string
): Promise<PortalResponse> {
  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/public/returns/orders/${encodeURIComponent(publicId)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo cargar el pedido"
    );
  }

  return response.json();
}

export default async function ReturnPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, rule } =
    await getPortal(id);

  const customerName =
    order.customer
      ? `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim()
      : "Cliente";

  const returnsAllowed =
    Boolean(
      rule?.isActive &&
      rule.allowReturns &&
      rule.withinReturnPeriod
    );

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm text-zinc-500">
            {order.store.name}
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Solicitar una devolución
          </h1>

          <p className="mt-3 text-sm text-zinc-600">
            Hola {customerName || "Cliente"}, revisa los productos de tu pedido.
          </p>
        </div>

        {rule && (
          <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium">
              Condiciones de devolución
            </p>

            <div className="mt-3 space-y-1 text-sm text-zinc-600">
              <p>
                Plazo: {rule.returnDays} días
              </p>
              <p>
                Reembolso:{" "}
                {rule.allowRefund
                  ? "Disponible"
                  : "No disponible"}
              </p>
              <p>
                Fotos:{" "}
                {rule.requirePhotos
                  ? "Obligatorias"
                  : "No obligatorias"}
              </p>
              <p>
                Aprobación:{" "}
                {rule.autoApprove
                  ? "Automática"
                  : "Revisión manual"}
              </p>
            </div>
          </section>
        )}

        {!rule && (
          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-800">
              Esta tienda no tiene una regla de devolución activa.
            </p>
          </section>
        )}

        {rule &&
          !rule.allowReturns && (
            <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-700">
                Esta tienda no permite devoluciones actualmente.
              </p>
            </section>
          )}

        {rule &&
          !rule.withinReturnPeriod && (
            <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-700">
                El plazo de devolución de este pedido ha finalizado.
              </p>

              {rule.returnDeadline && (
                <p className="mt-1 text-sm text-red-600">
                  Fecha límite:{" "}
                  {new Date(
                    rule.returnDeadline
                  ).toLocaleDateString(
                    "es-ES"
                  )}
                </p>
              )}
            </section>
          )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm text-zinc-500">
              Pedido
            </p>

            <p className="mt-1 font-medium">
              {order.orderNumber}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {new Date(
                order.orderedAt
              ).toLocaleDateString(
                "es-ES"
              )}
            </p>
          </div>

          {order.items.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Este pedido no tiene productos disponibles.
            </p>
          ) : (
            <div className="space-y-4">
              {order.items.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-zinc-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {item.productName}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {item.variantName ??
                            "Sin variante"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          SKU:{" "}
                          {item.sku ?? "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm">
                          {item.unitPrice}{" "}
                          {item.currency}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Cantidad:{" "}
                          {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-zinc-200 pt-4">
                      {item.isReturnable &&
                      returnsAllowed ? (
                        <Link
                          href={`/return/${order.publicId}/item/${item.id}`}
                          className="inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                        >
                          Devolver este producto
                        </Link>
                      ) : (
                        <span className="text-sm text-red-500">
                          Este producto no está disponible para devolución
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Gestión de devoluciones mediante Novex
        </p>
      </div>
    </main>
  );
}
