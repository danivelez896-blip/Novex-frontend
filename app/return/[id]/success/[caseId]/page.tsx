import Link from "next/link";

const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

type CaseDetail = {
  publicId: string;
  status: string;
  requestedAt: string;
  store: {
    name: string;
  };
};

async function getCase(
  publicId: string
): Promise<CaseDetail> {
  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/public/returns/cases/${encodeURIComponent(publicId)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo cargar la devolución"
    );
  }

  return response.json();
}

function getStatusContent(
  status: string
) {
  switch (status) {
    case "APPROVED":
      return {
        title:
          "Devolución aprobada",
        description:
          "Tu solicitud cumple las condiciones de devolución y ha sido aprobada automáticamente.",
        symbol: "✓",
        symbolClasses:
          "bg-emerald-100 text-emerald-700",
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

    case "REJECTED":
      return {
        title:
          "Devolución no aceptada",
        description:
          "La solicitud no cumple actualmente las condiciones de devolución de la tienda.",
        symbol: "×",
        symbolClasses:
          "bg-red-100 text-red-700",
      };

    default:
      return {
        title:
          "Solicitud enviada",
        description:
          "Hemos recibido correctamente tu solicitud de devolución.",
        symbol: "✓",
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
  const status =
    getStatusContent(
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

          <div className="mt-6 rounded-xl bg-zinc-100 p-4">
            <p className="text-sm text-zinc-500">
              Referencia de devolución
            </p>

            <p className="mt-1 break-all text-sm font-semibold">
              {caseData.publicId}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Estado:{" "}
              {caseData.status}
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
