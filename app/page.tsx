import { novexFetch } from "@/lib/novex-server";
import Link from "next/link";

type Store = {
  id: number;
  name: string;
  platform: string;
};

type Case = {
  id: number;
  status: string;
  requestedAt: string;
  customer?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  order?: {
    id: number;
    orderNumber: string;
    totalAmount: string;
    currency: string;
  } | null;
};

async function getCases(): Promise<Case[]> {
  const response = await novexFetch(
    "/cases"
  );

  if (!response.ok) {
    throw new Error("No se pudieron cargar las devoluciones");
  }

  return response.json();
}

function getStatusClasses(status: string) {
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
    default:
      return "bg-zinc-800 text-zinc-300";
  }
}

async function getStores(): Promise<Store[]> {
  const response = await novexFetch(
    "/stores"
  );

  if (!response.ok) {
    throw new Error(
      "No se pudieron cargar las tiendas"
    );
  }

  return response.json();
}

export default async function Home() {
  const [cases, stores] =
    await Promise.all([
      getCases(),
      getStores(),
    ]);

  const store =
    stores[0] ?? null;

  const total = cases.length;
  const pending = cases.filter(
    (item) => item.status === "PENDING_REVIEW"
  ).length;
  const approved = cases.filter(
    (item) => item.status === "APPROVED"
  ).length;
  const refunded = cases.filter(
    (item) => item.status === "REFUNDED"
  ).length;

  const recentCases = [...cases]
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() -
        new Date(a.requestedAt).getTime()
    )
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Plataforma de devoluciones
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Novex
            </h1>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            {store?.name ?? "Sin tienda"}
          </div>
        </header>

        <section className="mb-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Devoluciones totales
            </p>
            <p className="mt-2 text-3xl font-semibold">{total}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Pendientes</p>
            <p className="mt-2 text-3xl font-semibold">{pending}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Aprobadas</p>
            <p className="mt-2 text-3xl font-semibold">{approved}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Reembolsadas</p>
            <p className="mt-2 text-3xl font-semibold">{refunded}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-6 py-5">
            <h2 className="text-lg font-medium">
              Últimas devoluciones
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Haz clic en una devolución para ver su detalle
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-400">
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-4 font-medium">Caso</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Pedido</th>
                  <th className="px-6 py-4 font-medium">Importe</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                </tr>
              </thead>

              <tbody>
                {recentCases.map((item) => {
                  const customerName = item.customer
                    ? `${item.customer.firstName ?? ""} ${
                        item.customer.lastName ?? ""
                      }`.trim()
                    : "Sin cliente";

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-800 transition hover:bg-zinc-800/50 last:border-b-0"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/cases/${item.id}`}
                          className="block font-medium text-white"
                        >
                          #{item.id}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <Link href={`/cases/${item.id}`} className="block">
                          <p>{customerName || "Sin nombre"}</p>
                          <p className="text-xs text-zinc-500">
                            {item.customer?.email ?? ""}
                          </p>
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <Link href={`/cases/${item.id}`} className="block">
                          {item.order?.orderNumber ?? "-"}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <Link href={`/cases/${item.id}`} className="block">
                          {item.order
                            ? `${item.order.totalAmount} ${item.order.currency}`
                            : "-"}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <Link href={`/cases/${item.id}`} className="block">
                          <span
                            className={`rounded-full px-3 py-1 ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}