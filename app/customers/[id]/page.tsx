import Link from "next/link";
import { notFound } from "next/navigation";

type Customer = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

type Order = {
  id: number;
  customerId: number | null;
  orderNumber: string;
  totalAmount: string;
  currency: string;
  orderedAt: string;
};

type Case = {
  id: number;
  customerId: number | null;
  status: string;
  requestedAt: string;
  order?: {
    orderNumber: string;
  } | null;
};

async function getCustomerData(id: number) {
  const [customersResponse, ordersResponse, casesResponse] =
    await Promise.all([
      fetch(
        "https://novex-production-f614.up.railway.app/api/customers",
        { cache: "no-store" }
      ),
      fetch(
        "https://novex-production-f614.up.railway.app/api/orders",
        { cache: "no-store" }
      ),
      fetch(
        "https://novex-production-f614.up.railway.app/api/cases",
        { cache: "no-store" }
      ),
    ]);

  if (
    !customersResponse.ok ||
    !ordersResponse.ok ||
    !casesResponse.ok
  ) {
    throw new Error("No se pudieron cargar los datos del cliente");
  }

  const customers: Customer[] = await customersResponse.json();
  const orders: Order[] = await ordersResponse.json();
  const cases: Case[] = await casesResponse.json();

  const customer = customers.find((item) => item.id === id);

  if (!customer) {
    return null;
  }

  return {
    customer,
    orders: orders.filter((order) => order.customerId === id),
    cases: cases.filter((item) => item.customerId === id),
  };
}

function getStatusClasses(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-500/10 text-emerald-400";
    case "PENDING_REVIEW":
      return "bg-amber-500/10 text-amber-400";
    case "REJECTED":
      return "bg-red-500/10 text-red-400";
    case "REFUNDED":
      return "bg-blue-500/10 text-blue-400";
    case "CLOSED":
      return "bg-zinc-700 text-zinc-200";
    default:
      return "bg-zinc-800 text-zinc-300";
  }
}

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await getCustomerData(Number(id));

  if (!data) {
    notFound();
  }

  const { customer, orders, cases } = data;

  const customerName =
    `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <Link
          href="/customers"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← Volver a clientes
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm text-zinc-400">Cliente</p>

        <h1 className="mt-1 text-3xl font-semibold">
          {customerName || "Sin nombre"}
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Cliente #{customer.id}
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Pedidos</p>
          <p className="mt-2 text-3xl font-semibold">
            {orders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Devoluciones</p>
          <p className="mt-2 text-3xl font-semibold">
            {cases.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Cliente desde</p>
          <p className="mt-2 text-lg font-medium">
            {new Date(customer.createdAt).toLocaleDateString(
              "es-ES"
            )}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">
          Información de contacto
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-500">Email</p>
            <p className="mt-1 text-sm">
              {customer.email ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Teléfono</p>
            <p className="mt-1 text-sm">
              {customer.phone ?? "-"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">Pedidos</h2>

        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            Este cliente no tiene pedidos.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition hover:bg-zinc-900"
              >
                <div>
                  <p className="font-medium">
                    {order.orderNumber}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(
                      order.orderedAt
                    ).toLocaleDateString("es-ES")}
                  </p>
                </div>

                <p className="text-sm">
                  {order.totalAmount} {order.currency}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">
          Devoluciones
        </h2>

        {cases.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            Este cliente no tiene devoluciones.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {cases.map((item) => (
              <Link
                key={item.id}
                href={`/cases/${item.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition hover:bg-zinc-900"
              >
                <div>
                  <p className="font-medium">
                    Caso #{item.id}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {item.order?.orderNumber ?? "Sin pedido"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs ${getStatusClasses(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}