"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Customer = {
  id: number;
  storeId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export default function CustomersTable({
  customers,
}: {
  customers: Customer[];
}) {
  const [query, setQuery] =
    useState("");

  const filteredCustomers =
    useMemo(() => {
      const normalized =
        query.trim().toLowerCase();

      return customers.filter(
        (customer) => {
          const name =
            `${customer.firstName ?? ""} ${customer.lastName ?? ""}`
              .trim()
              .toLowerCase();

          return (
            !normalized ||
            name.includes(normalized) ||
            (customer.email ?? "")
              .toLowerCase()
              .includes(normalized) ||
            (customer.phone ?? "")
              .toLowerCase()
              .includes(normalized)
          );
        }
      );
    }, [customers, query]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Buscar por nombre, email o teléfono..."
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
        />

        <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
          {filteredCustomers.length} resultados
        </div>
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
                <th className="px-6 py-4 font-medium">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No hay clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(
                  (customer) => {
                    const customerName =
                      `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();

                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-zinc-800 transition hover:bg-zinc-800/50 last:border-b-0"
                      >
                        <td className="px-6 py-4 font-medium">
                          {customerName ||
                            "Sin nombre"}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {customer.email ??
                            "-"}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {customer.phone ??
                            "-"}
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(
                            customer.createdAt
                          ).toLocaleDateString(
                            "es-ES"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="inline-flex rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                          >
                            Ver cliente
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
