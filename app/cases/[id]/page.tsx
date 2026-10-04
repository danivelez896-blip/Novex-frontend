import ShipmentActions from "./ShipmentActions";
import RefundActions from "./RefundActions";
import CaseActions from "./CaseActions";

type CaseDetail = {
  id: number;
  status: string;
  requestedAt: string;
  closedAt?: string | null;
  customer?: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  order?: {
    orderNumber: string;
    totalAmount: string;
    currency: string;
    items: {
      id: number;
      productName: string;
      variantName: string | null;
      sku: string | null;
      quantity: number;
      unitPrice: string;
      currency: string;
    }[];
  } | null;
  items: {
    id: number;
    quantity: number;
    reason: string;
    customerComment?: string | null;
    orderItem: {
      productName: string;
      variantName: string | null;
      sku: string | null;
      unitPrice: string;
      currency: string;
    };
  }[];
  shipments: {
    id: number;
    carrier?: string | null;
    trackingNumber?: string | null;
    status: string;
  }[];
  refunds: {
    id: number;
    amount: string;
    currency: string;
    status: string;
  }[];
  events: {
    id: number;
    eventType: string;
    description?: string | null;
    createdAt: string;
  }[];
  attachments: {
  id: number;
  fileType: string;
  fileUrl: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
}[];
};

async function getCase(id: string): Promise<CaseDetail> {
  const response = await fetch(
    `http://localhost:3002/api/cases/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar la devolución");
  }

  return response.json();
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseData = await getCase(id);

  const customerName = caseData.customer
    ? `${caseData.customer.firstName ?? ""} ${
        caseData.customer.lastName ?? ""
      }`.trim()
    : "Sin cliente";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <a
            href="/"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            ← Volver al dashboard
          </a>
        </div>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">Devolución</p>
            <h1 className="mt-1 text-3xl font-semibold">
              Caso #{caseData.id}
            </h1>
          </div>

          <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm">
            {caseData.status}
          </span>
        </div>

        <div className="mb-6">
  <CaseActions
    caseId={caseData.id}
    currentStatus={caseData.status}
  />
</div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-medium">Cliente</h2>

            <div className="space-y-2 text-sm">
              <p>{customerName}</p>
              <p className="text-zinc-400">
                {caseData.customer?.email ?? "-"}
              </p>
              <p className="text-zinc-400">
                {caseData.customer?.phone ?? "-"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-medium">Pedido</h2>

            <div className="space-y-2 text-sm">
              <p>{caseData.order?.orderNumber ?? "-"}</p>
              <p className="text-zinc-400">
                {caseData.order
                  ? `${caseData.order.totalAmount} ${caseData.order.currency}`
                  : "-"}
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-medium">Producto devuelto</h2>

          {caseData.items.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Este caso no tiene productos asociados.
            </p>
          ) : (
            <div className="space-y-4">
              {caseData.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {item.orderItem.productName}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {item.orderItem.variantName ?? "Sin variante"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        SKU: {item.orderItem.sku ?? "-"}
                      </p>
                    </div>

                    <p className="text-sm">
                      {item.orderItem.unitPrice}{" "}
                      {item.orderItem.currency}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-zinc-800 pt-4 text-sm">
                    <p>
                      <span className="text-zinc-400">Motivo:</span>{" "}
                      {item.reason}
                    </p>

                    {item.customerComment && (
                      <p className="mt-2">
                        <span className="text-zinc-400">
                          Comentario:
                        </span>{" "}
                        {item.customerComment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-medium">Envío</h2>

            {caseData.shipments.length === 0 ? (
              <p className="text-sm text-zinc-400">Sin envío todavía.</p>
            ) : (
              caseData.shipments.map((shipment) => (
                <div key={shipment.id} className="space-y-2 text-sm">
                  <p>{shipment.carrier ?? "Transportista sin definir"}</p>
                  <p className="text-zinc-400">
                    {shipment.trackingNumber ?? "Sin tracking"}
                  </p>
                  <p>{shipment.status}</p>
                </div>
              ))
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-medium">Reembolso</h2>

            {caseData.refunds.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Sin reembolso todavía.
              </p>
            ) : (
              caseData.refunds.map((refund) => (
                <div key={refund.id} className="space-y-2 text-sm">
                  <p>
                    {refund.amount} {refund.currency}
                  </p>
                  <p className="text-zinc-400">{refund.status}</p>
                </div>
              ))
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          {caseData.attachments.length > 0 && (
  <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
    <h2 className="text-lg font-medium">
      Fotos del cliente
    </h2>

    <p className="mt-1 text-sm text-zinc-500">
      Imágenes adjuntadas durante la solicitud de devolución.
    </p>

    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {caseData.attachments
        .filter(
          (attachment) =>
            attachment.fileType === "IMAGE"
        )
        .map((attachment) => (
          <div
            key={attachment.id}
            className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
          >
            <img
              src={`/api/return-photos/view?path=${encodeURIComponent(
                attachment.fileUrl
              )}`}
              alt={
                attachment.fileName ??
                "Foto de la devolución"
              }
              className="h-56 w-full object-cover"
            />

            <div className="p-3">
              <p className="truncate text-xs text-zinc-400">
                {attachment.fileName ??
                  "Imagen"}
              </p>
            </div>
          </div>
        ))}
    </div>
  </section>
)}
<RefundActions
  caseId={caseData.id}
  caseStatus={caseData.status}
  orderTotal={caseData.order?.totalAmount ?? "0"}
  currency={caseData.order?.currency ?? "EUR"}
  refunds={caseData.refunds}
/>
<ShipmentActions
  caseId={caseData.id}
  caseStatus={caseData.status}
  shipments={caseData.shipments}
/>
          <h2 className="mb-5 text-lg font-medium">Historial</h2>

          <div className="space-y-5">
            {caseData.events.map((event) => (
              <div
                key={event.id}
                className="border-l border-zinc-700 pl-4"
              >
                <p className="text-sm font-medium">{event.eventType}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {event.description ?? "-"}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {new Date(event.createdAt).toLocaleString("es-ES")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}