import {
  getActiveStoreId,
  novexFetch,
} from "@/lib/novex-server";
import ReturnRulesEditor from "./ReturnRulesEditor";

type ReturnRule = {
  id: number;
  companyId: number;
  storeId: number | null;
  productId: number | null;
  returnDays: number;
  allowReturns: boolean;
  allowRefund: boolean;
  allowSizeExchange: boolean;
  allowColorExchange: boolean;
  allowProductExchange: boolean;
  requirePhotos: boolean;
  autoApprove: boolean;
  rejectionMessage: string | null;
  isActive: boolean;
};

type Store = {
  id: number;
  companyId: number;
  name: string;
};

type Session = {
  companies: {
    companyId: number;
    role:
      | "OWNER"
      | "ADMIN"
      | "EMPLOYEE"
      | "READ_ONLY";
  }[];
};

async function getData() {
  const [
    rulesResponse,
    storesResponse,
    meResponse,
    activeStoreId,
  ] = await Promise.all([
    novexFetch("/return-rules"),
    novexFetch("/stores"),
    novexFetch("/auth/me"),
    getActiveStoreId(),
  ]);

  if (
    !rulesResponse.ok ||
    !storesResponse.ok ||
    !meResponse.ok
  ) {
    throw new Error(
      "No se pudieron cargar las reglas de devolución"
    );
  }

  const rules: ReturnRule[] =
    await rulesResponse.json();
  const stores: Store[] =
    await storesResponse.json();
  const session: Session =
    await meResponse.json();

  const store =
    stores.find(
      (item) =>
        item.id === activeStoreId
    ) ??
    stores[0] ??
    null;

  if (!store) {
    return {
      store: null,
      rule: null,
      canEdit: false,
    };
  }

  const rule =
    rules.find(
      (item) =>
        item.storeId === store.id &&
        item.productId === null
    ) ?? null;

  const membership =
    session.companies.find(
      (item) =>
        item.companyId ===
        store.companyId
    );

  const canEdit =
    membership?.role === "OWNER" ||
    membership?.role === "ADMIN";

  return {
    store,
    rule,
    canEdit,
  };
}

export default async function ReturnRulesPage() {
  const {
    store,
    rule,
    canEdit,
  } = await getData();

  if (!store) {
    return (
      <div className="px-8 py-8">
        <h1 className="text-3xl font-semibold">
          Reglas de devolución
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          No hay ninguna tienda disponible para configurar.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">
          Política de devoluciones
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Reglas
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Configuración general para{" "}
          <span className="text-zinc-300">
            {store.name}
          </span>
          . Las reglas específicas por producto se añadirán más adelante en el apartado 11.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Regla general
          </p>
          <p className="mt-2 text-lg font-medium">
            {rule
              ? "Configurada"
              : "Sin configurar"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Plazo
          </p>
          <p className="mt-2 text-lg font-medium">
            {rule
              ? `${rule.returnDays} días`
              : "30 días por defecto"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Aprobación
          </p>
          <p className="mt-2 text-lg font-medium">
            {rule
              ? rule.autoApprove
                ? "Automática"
                : "Manual"
              : "Automática por defecto"}
          </p>
        </div>
      </div>

      <ReturnRulesEditor
        rule={rule}
        companyId={store.companyId}
        storeId={store.id}
        canEdit={canEdit}
      />
    </div>
  );
}
