import ReturnRequestForm from "./ReturnRequestForm";

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
      returnableQuantity: number;
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    draft?: string;
  }>;
}) {
  const { id } = await params;
  const { draft } =
    await searchParams;
  const { order, rule } =
    await getPortal(id);

  const customerName =
    order.customer
      ? `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim()
      : "Cliente";

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
            Hola {customerName || "Cliente"}, selecciona los productos que quieres devolver.
          </p>
        </div>

        {rule && (
          <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium">
              Condiciones de devolución
            </p>

            <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
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

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Pedido
          </p>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium">
              {order.orderNumber}
            </p>

            <p className="text-sm text-zinc-500">
              {new Date(
                order.orderedAt
              ).toLocaleDateString(
                "es-ES"
              )}
            </p>
          </div>
        </section>

        <ReturnRequestForm
          orderPublicId={
            order.publicId
          }
          items={order.items}
          initialDraftToken={
            draft
          }
          rule={
            rule
              ? {
                  requirePhotos:
                    rule.requirePhotos,
                  allowReturns:
                    rule.allowReturns,
                  isActive:
                    rule.isActive,
                  withinReturnPeriod:
                    rule.withinReturnPeriod,
                }
              : null
          }
        />

        <p className="mt-6 text-center text-xs text-zinc-400">
          Gestión de devoluciones mediante Novex
        </p>
      </div>
    </main>
  );
}
