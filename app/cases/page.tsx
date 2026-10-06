import { novexFetch } from "@/lib/novex-server";
import Link from "next/link";

type Case = {
  id: number;
  status: string;
  requestedAt: string;
  customer?: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  order?: {
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

export default async function CasesPage() {
  const cases = await getCases();

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Gestión</p>
        <h1 className="mt-1 text-3xl font-semibold">Devoluciones</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Todas las solicitudes de devolución
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-400">
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 font-medium">Caso</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Pedido</th>
                <th className="px-6 py-4 font-medium">Importe</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>

            <tbody>
              {cases.map((item) => {
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
                        className="font-medium"
                      >
                        #{item.id}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link href={`/cases/${item.id}`} className="block">
                        <p>{customerName}</p>
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

                    <td className="px-6 py-4 text-zinc-400">
                      <Link href={`/cases/${item.id}`} className="block">
                        {new Date(item.requestedAt).toLocaleDateString("es-ES")}
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
      </div>
    </div>
  );
}