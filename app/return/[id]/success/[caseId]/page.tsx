import Link from "next/link";

const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

type CaseDetail = {
  publicId: string;
  status: string;
  requestedAt: string;
  closedAt: string | null;
  store: {
    name: string;
  };
  order: {
    publicId: string;
    orderNumber: string;
  };
  events: {
    eventType: string;
    createdAt: string;
  }[];
  shipment: {
    carrier: string | null;
    shippingProvider: string | null;
    trackingNumber: string | null;
    status: string;
    labelUrl: string | null;
    qrCodeUrl: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
};

async function getCase(
  publicId: string
): Promise<CaseDetail | null> {
  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/public/returns/cases/${encodeURIComponent(publicId)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

const STATUS_LABELS: Record<
  string,
  string
> = {
  REQUESTED: "Solicitud enviada",
  PENDING_REVIEW:
    "Pendiente de revisión",
  APPROVED: "Aprobada",
  WAITING_CUSTOMER:
    "Esperando tu envío",
  IN_TRANSIT: "En tránsito",
  RECEIVED:
    "Recibida por la tienda",
  INSPECTION:
    "En inspección",
  REFUNDED:
    "Reembolso realizado",
  EXCHANGE_SENT:
    "Cambio enviado",
  CLOSED: "Finalizada",
  REJECTED: "No aceptada",
  CANCELLED: "Cancelada",
};

const STATUS_ORDER = [
  "REQUESTED",
  "APPROVED",
  "WAITING_CUSTOMER",
  "IN_TRANSIT",
  "RECEIVED",
  "INSPECTION",
  "REFUNDED",
];

const SHIPMENT_STATUS_LABELS: Record<
  string,
  string
> = {
  LABEL_CREATED: "Etiqueta creada",
  PENDING_DROPOFF:
    "Pendiente de entrega al transportista",
  IN_TRANSIT: "En tránsito",
  DELIVERED: "Entregado",
  INCIDENT:
    "Incidencia en el transporte",
  LOST: "Envío extraviado",
  CANCELLED: "Envío cancelado",
};



function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleString(
    "es-ES",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function getStatusContent(
  status: string
) {
  switch (status) {
    case "REQUESTED":
      return {
        title: "Solicitud enviada",
        description:
          "Hemos recibido correctamente tu solicitud de devolución.",
        symbol: "✓",
        symbolClasses:
          "bg-zinc-100 text-zinc-700",
      };

    case "PENDING_REVIEW":
      return {
        title:
          "Solicitud recibida",
        description:
          "Tu devolución está pendiente de revisión por parte de la tienda.",
        symbol: "…",
        symbolClasses:
          "bg-amber-100 text-amber-700",
      };

    case "APPROVED":
      return {
        title:
          "Devolución aprobada",
        description:
          "Tu devolución ha sido aprobada. Sigue las instrucciones de envío cuando estén disponibles.",
        symbol: "✓",
        symbolClasses:
          "bg-emerald-100 text-emerald-700",
      };

    case "WAITING_CUSTOMER":
      return {
        title:
          "Esperando tu envío",
        description:
          "La devolución está preparada. Entrega el paquete siguiendo las instrucciones de transporte.",
        symbol: "→",
        symbolClasses:
          "bg-blue-100 text-blue-700",
      };

    case "IN_TRANSIT":
      return {
        title:
          "Devolución en tránsito",
        description:
          "Tu paquete está viajando hacia la tienda.",
        symbol: "→",
        symbolClasses:
          "bg-blue-100 text-blue-700",
      };

    case "RECEIVED":
      return {
        title:
          "Devolución recibida",
        description:
          "La tienda ya ha recibido tu paquete.",
        symbol: "✓",
        symbolClasses:
          "bg-emerald-100 text-emerald-700",
      };

    case "INSPECTION":
      return {
        title:
          "Producto en inspección",
        description:
          "La tienda está revisando los productos devueltos.",
        symbol: "…",
        symbolClasses:
          "bg-amber-100 text-amber-700",
      };

    case "REFUNDED":
      return {
        title:
          "Reembolso realizado",
        description:
          "La devolución ha sido procesada y el reembolso ha sido emitido.",
        symbol: "✓",
        symbolClasses:
          "bg-emerald-100 text-emerald-700",
      };

    case "EXCHANGE_SENT":
      return {
        title: "Cambio enviado",
        description:
          "El producto de sustitución ya ha sido enviado.",
        symbol: "✓",
        symbolClasses:
          "bg-emerald-100 text-emerald-700",
      };

    case "CLOSED":
      return {
        title: "Devolución finalizada",
        description:
          "El proceso de devolución ha finalizado.",
        symbol: "✓",
        symbolClasses:
          "bg-emerald-100 text-emerald-700",
      };

    case "REJECTED":
      return {
        title:
          "Devolución no aceptada",
        description:
          "La tienda ha rechazado esta solicitud de devolución.",
        symbol: "×",
        symbolClasses:
          "bg-red-100 text-red-700",
      };

    case "CANCELLED":
      return {
        title:
          "Devolución cancelada",
        description:
          "Esta solicitud de devolución ha sido cancelada.",
        symbol: "×",
        symbolClasses:
          "bg-red-100 text-red-700",
      };

    default:
      return {
        title:
          "Estado de la devolución",
        description:
          "Consulta aquí el estado actualizado de tu devolución.",
        symbol: "•",
        symbolClasses:
          "bg-zinc-100 text-zinc-700",
      };
  }
}

export default async function ReturnSuccessPage({
  params,
}: {
  params: Promise<{
    id: string;
    caseId: string;
  }>;
}) {
  const { id, caseId } =
    await params;

  const caseData =
    await getCase(caseId);

  if (!caseData) {
    return (
      <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-xl">
          <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-semibold">
              Devolución no disponible
            </h1>

            <p className="mt-3 text-sm text-zinc-600">
              No hemos podido encontrar esta devolución. Comprueba el enlace o contacta con la tienda si necesitas ayuda.
            </p>

            <Link
              href={`/return/${id}`}
              className="mt-6 inline-block text-sm font-medium text-zinc-600 transition hover:text-black"
            >
              Volver al pedido
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const status =
    getStatusContent(
      caseData.status
    );

  const eventByStatus =
    new Map<string, string>();

  for (const event of
    caseData.events) {
    const mappedStatus =
      event.eventType ===
      "RETURN_REQUESTED"
        ? "REQUESTED"
        : event.eventType ===
            "AUTO_APPROVED"
          ? "APPROVED"
          : event.eventType;

    if (
      STATUS_ORDER.includes(
        mappedStatus
      ) &&
      !eventByStatus.has(
        mappedStatus
      )
    ) {
      eventByStatus.set(
        mappedStatus,
        event.createdAt
      );
    }
  }

  const currentIndex =
    STATUS_ORDER.indexOf(
      caseData.status
    );

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-xl">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${status.symbolClasses}`}
          >
            {status.symbol}
          </div>

          <p className="mt-5 text-sm text-zinc-500">
            {caseData.store.name}
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            {status.title}
          </h1>

          <p className="mt-3 text-sm text-zinc-600">
            {status.description}
          </p>

          <div className="mt-8 text-left">
            <p className="text-sm font-medium text-zinc-900">
              Seguimiento de la devolución
            </p>

            <div className="mt-4 space-y-4">
              {caseData.status ===
                "PENDING_REVIEW" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">
                    Pendiente de revisión
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    La tienda debe revisar tu solicitud antes de continuar.
                  </p>
                </div>
              )}

              {[
                ...STATUS_ORDER,
              ].map(
                (
                  step,
                  index
                ) => {
                  const completed =
                    currentIndex >=
                      index ||
                    eventByStatus.has(
                      step
                    );

                  return (
                    <div
                      key={step}
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            completed
                              ? "bg-emerald-600 text-white"
                              : "bg-zinc-200 text-zinc-500"
                          }`}
                        >
                          {completed
                            ? "✓"
                            : index +
                              1}
                        </div>

                        {index <
                          STATUS_ORDER.length -
                            1 && (
                          <div className="mt-1 h-7 w-px bg-zinc-200" />
                        )}
                      </div>

                      <div className="pb-1">
                        <p
                          className={`text-sm font-medium ${
                            completed
                              ? "text-zinc-900"
                              : "text-zinc-400"
                          }`}
                        >
                          {STATUS_LABELS[
                            step
                          ]}
                        </p>

                        {eventByStatus.get(
                          step
                        ) && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {formatDate(
                              eventByStatus.get(
                                step
                              )!
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              {(caseData.status ===
                "REJECTED" ||
                caseData.status ===
                  "CANCELLED") && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">
                    {STATUS_LABELS[
                      caseData.status
                    ]}
                  </p>
                </div>
              )}
            </div>
          </div>

          {caseData.shipment && (
            <div className="mt-8 rounded-xl border border-zinc-200 p-5 text-left">
              <p className="text-sm font-medium text-zinc-900">
                Envío de devolución
              </p>

              <div className="mt-3 space-y-2 text-sm text-zinc-600">
                <p>
                  Transportista:{" "}
                  {caseData.shipment
                    .carrier ??
                    caseData.shipment
                      .shippingProvider ??
                    "Pendiente"}
                </p>

                {caseData.shipment
                  .trackingNumber && (
                  <p>
                    Seguimiento:{" "}
                    <span className="font-medium text-zinc-900">
                      {
                        caseData
                          .shipment
                          .trackingNumber
                      }
                    </span>
                  </p>
                )}

                <p>
                  Estado del envío:{" "}
                  {SHIPMENT_STATUS_LABELS[
                    caseData.shipment
                      .status
                  ] ??
                    caseData.shipment
                      .status}
                </p>
              </div>

              {(caseData.shipment
                .labelUrl ||
                caseData.shipment
                  .qrCodeUrl) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {caseData.shipment
                    .labelUrl && (
                    <a
                      href={
                        caseData
                          .shipment
                          .labelUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
                    >
                      Abrir etiqueta
                    </a>
                  )}

                  {caseData.shipment
                    .qrCodeUrl && (
                    <a
                      href={
                        caseData
                          .shipment
                          .qrCodeUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium"
                    >
                      Abrir QR
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 rounded-xl bg-zinc-100 p-4">
            <p className="text-sm text-zinc-500">
              Referencia de devolución
            </p>

            <p className="mt-1 break-all text-sm font-semibold">
              {caseData.publicId}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Estado:{" "}
              {STATUS_LABELS[
                caseData.status
              ] ??
                caseData.status}
            </p>
          </div>

          <Link
            href={`/return/${id}`}
            className="mt-6 inline-block text-sm font-medium text-zinc-600 transition hover:text-black"
          >
            Volver al pedido
          </Link>
        </section>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Gestión de devoluciones mediante Novex
        </p>
      </div>
    </main>
  );
}
