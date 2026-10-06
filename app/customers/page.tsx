import {
  getActiveStoreId,
  novexFetch,
} from "@/lib/novex-server";
import CustomersTable from "./CustomersTable";

type Customer = {
  id: number;
  storeId: number;
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
    throw new Error(
      "No se pudieron cargar los clientes"
    );
  }

  return response.json();
}

export default async function CustomersPage() {
  const [customers, activeStoreId] =
    await Promise.all([
      getCustomers(),
      getActiveStoreId(),
    ]);

  const visibleCustomers =
    activeStoreId
      ? customers.filter(
          (customer) =>
            customer.storeId ===
            activeStoreId
        )
      : customers;

  const withEmail =
    visibleCustomers.filter(
      (customer) =>
        Boolean(customer.email)
    ).length;

  const withPhone =
    visibleCustomers.filter(
      (customer) =>
        Boolean(customer.phone)
    ).length;

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">
          Gestión
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Clientes
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Clientes vinculados a la tienda activa.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Clientes totales
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {visibleCustomers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Con email
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {withEmail}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Con teléfono
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {withPhone}
          </p>
        </div>
      </div>

      <CustomersTable
        customers={visibleCustomers}
      />
    </div>
  );
}
