import {
  getActiveStoreId,
  novexFetch,
} from "@/lib/novex-server";
import CasesTable from "./CasesTable";

type Case = {
  id: number;
  storeId: number;
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
    throw new Error(
      "No se pudieron cargar las devoluciones"
    );
  }

  return response.json();
}

export default async function CasesPage() {
  const [cases, activeStoreId] =
    await Promise.all([
      getCases(),
      getActiveStoreId(),
    ]);

  const visibleCases =
    activeStoreId
      ? cases.filter(
          (item) =>
            item.storeId ===
            activeStoreId
        )
      : cases;

  const pending =
    visibleCases.filter(
      (item) =>
        item.status ===
          "PENDING_REVIEW" ||
        item.status ===
          "REQUESTED"
    ).length;

  const inProgress =
    visibleCases.filter(
      (item) =>
        [
          "APPROVED",
          "WAITING_CUSTOMER",
          "IN_TRANSIT",
          "RECEIVED",
          "INSPECTION",
        ].includes(item.status)
    ).length;

  const completed =
    visibleCases.filter(
      (item) =>
        [
          "REFUNDED",
          "CLOSED",
        ].includes(item.status)
    ).length;

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">
          Gestión
        </p>
        <h1 className="mt-1 text-3xl font-semibold">
          Devoluciones
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Revisa, filtra y gestiona las solicitudes de la tienda activa.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Total
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {visibleCases.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Pendientes
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-400">
            {pending}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            En curso
          </p>
          <p className="mt-2 text-2xl font-semibold text-cyan-400">
            {inProgress}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Finalizadas
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {completed}
          </p>
        </div>
      </div>

      <CasesTable cases={visibleCases} />
    </div>
  );
}
