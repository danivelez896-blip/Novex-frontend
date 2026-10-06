import { novexFetch } from "@/lib/novex-server";
import Link from "next/link";

type Customer = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

async function getCustomers(): Promise<Customer[]> {
  const response = await novexFetch(
    "/customers"
  );

  if (!response.ok) {
    throw new Error("No se pudieron cargar los clientes");
  }

  return response.json();
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Gestión</p>

        <h1 className="mt-1 text-3xl font-semibold">
          Clientes
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Clientes vinculados a las tiendas de Novex
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-400">
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 font-medium">
                  Cliente
                </th>

                <th className="px-6 py-4 font-medium">
                  Email
                </th>

                <th className="px-6 py-4 font-medium">
                  Teléfono
                </th>

                <th className="px-6 py-4 font-medium">
                  Alta
                </th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => {
                const customerName =
                  `${customer.firstName ?? ""} ${
                    customer.lastName ?? ""
                  }`.trim();

                return (
                  <tr
                    key={customer.id}
                    className="border-b border-zinc-800 transition hover:bg-zinc-800/50 last:border-b-0"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="block font-medium"
                      >
                        {customerName || "Sin nombre"}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="block text-zinc-300"
                      >
                        {customer.email ?? "-"}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="block text-zinc-300"
                      >
                        {customer.phone ?? "-"}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="block text-zinc-400"
                      >
                        {new Date(
                          customer.createdAt
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