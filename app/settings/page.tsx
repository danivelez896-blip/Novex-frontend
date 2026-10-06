import {
  getActiveStoreId,
  novexFetch,
} from "@/lib/novex-server";

type Company = {
  id: number;
  name: string;
  status: string;
  currency: string;
  language: string;
  timezone: string;
  contactEmail: string | null;
};

type Store = {
  id: number;
  name: string;
  domain: string | null;
  platform: string;
  companyId: number;
  status: string;
  currency: string;
  language: string;
  lastSyncAt: string | null;
};

type Integration = {
  id: number;
  storeId: number;
  provider: string;
  status: string;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  settings?: Record<string, unknown> | null;
};

async function getIntegration(
  storeId: number,
  provider: "shopify" | "sendcloud"
): Promise<Integration | null> {
  const response = await novexFetch(
    `/integrations/stores/${storeId}/${provider}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar la integración ${provider}`
    );
  }

  return response.json();
}

async function getSettingsData() {
  const [
    storesResponse,
    companiesResponse,
    activeStoreId,
  ] = await Promise.all([
    novexFetch("/stores"),
    novexFetch("/companies"),
    getActiveStoreId(),
  ]);

  if (
    !storesResponse.ok ||
    !companiesResponse.ok
  ) {
    throw new Error(
      "No se pudo cargar la configuración"
    );
  }

  const stores: Store[] =
    await storesResponse.json();
  const companies: Company[] =
    await companiesResponse.json();

  const store =
    stores.find(
      (item) =>
        item.id === activeStoreId
    ) ??
    stores[0] ??
    null;

  const company =
    companies.find(
      (item) =>
        item.id === store?.companyId
    ) ??
    companies[0] ??
    null;

  if (!store) {
    return {
      store,
      company,
      shopify: null,
      sendcloud: null,
    };
  }

  const [shopify, sendcloud] =
    await Promise.all([
      getIntegration(
        store.id,
        "shopify"
      ),
      getIntegration(
        store.id,
        "sendcloud"
      ),
    ]);

  return {
    store,
    company,
    shopify,
    sendcloud,
  };
}

function statusLabel(
  status?: string | null
) {
  const labels: Record<string, string> = {
    ACTIVE: "Activa",
    TRIAL: "Prueba",
    SUSPENDED: "Suspendida",
    CANCELLED: "Cancelada",
    CONNECTED: "Conectada",
    DISCONNECTED: "Desconectada",
    ATTENTION_REQUIRED:
      "Requiere atención",
    SYNCING: "Sincronizando",
    ERROR: "Error",
    PENDING: "Pendiente",
  };

  return status
    ? labels[status] ?? status
    : "No configurado";
}

function statusClasses(
  status?: string | null
) {
  if (
    status === "CONNECTED" ||
    status === "ACTIVE"
  ) {
    return "bg-emerald-500/10 text-emerald-400";
  }

  if (
    status === "ERROR" ||
    status === "ATTENTION_REQUIRED" ||
    status === "SUSPENDED"
  ) {
    return "bg-red-500/10 text-red-400";
  }

  if (
    status === "SYNCING" ||
    status === "PENDING" ||
    status === "TRIAL"
  ) {
    return "bg-amber-500/10 text-amber-400";
  }

  return "bg-zinc-800 text-zinc-400";
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(
    "es-ES"
  );
}

function IntegrationCard({
  name,
  description,
  integration,
}: {
  name: string;
  description: string;
  integration: Integration | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {name}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {description}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs ${statusClasses(
            integration?.status
          )}`}
        >
          {statusLabel(
            integration?.status
          )}
        </span>
      </div>

      {integration && (
        <div className="mt-4 grid gap-3 border-t border-zinc-800 pt-4 text-xs sm:grid-cols-2">
          <div>
            <p className="text-zinc-600">
              Conectada
            </p>
            <p className="mt-1 text-zinc-300">
              {formatDate(
                integration.connectedAt
              )}
            </p>
          </div>

          <div>
            <p className="text-zinc-600">
              Última sincronización
            </p>
            <p className="mt-1 text-zinc-300">
              {formatDate(
                integration.lastSyncAt
              )}
            </p>
          </div>

          {integration.lastError && (
            <div className="sm:col-span-2">
              <p className="text-zinc-600">
                Último error
              </p>
              <p className="mt-1 text-red-400">
                {integration.lastError}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default async function SettingsPage() {
  const {
    store,
    company,
    shopify,
    sendcloud,
  } = await getSettingsData();

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">
          Sistema
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Configuración
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Estado real de la empresa,
          tienda activa e integraciones.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">
              Tienda
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-xs ${statusClasses(
                store?.status
              )}`}
            >
              {statusLabel(
                store?.status
              )}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-zinc-500">
                Nombre
              </p>
              <p className="mt-1 text-sm">
                {store?.name ??
                  "Sin tienda"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Plataforma
              </p>
              <p className="mt-1 text-sm">
                {store?.platform ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Dominio
              </p>
              <p className="mt-1 break-all text-sm">
                {store?.domain ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Moneda
              </p>
              <p className="mt-1 text-sm">
                {store?.currency ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Idioma
              </p>
              <p className="mt-1 text-sm">
                {store?.language ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Última sincronización
              </p>
              <p className="mt-1 text-sm">
                {formatDate(
                  store?.lastSyncAt
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">
              Empresa
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-xs ${statusClasses(
                company?.status
              )}`}
            >
              {statusLabel(
                company?.status
              )}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-zinc-500">
                Nombre
              </p>
              <p className="mt-1 text-sm">
                {company?.name ??
                  "Sin empresa"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Moneda
              </p>
              <p className="mt-1 text-sm">
                {company?.currency ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Idioma
              </p>
              <p className="mt-1 text-sm">
                {company?.language ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Zona horaria
              </p>
              <p className="mt-1 text-sm">
                {company?.timezone ?? "-"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-zinc-500">
                Email de contacto
              </p>
              <p className="mt-1 text-sm">
                {company?.contactEmail ??
                  "-"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
          <h2 className="text-lg font-medium">
            Integraciones
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Estado leído directamente
            desde Novex para la tienda
            activa.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <IntegrationCard
              name="Shopify"
              description="Pedidos, productos, clientes y reembolsos"
              integration={shopify}
            />

            <IntegrationCard
              name="Sendcloud"
              description="Envíos de devolución, etiquetas y tracking"
              integration={sendcloud}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
          <h2 className="text-lg font-medium">
            Pagos y facturación
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            La configuración de Stripe
            y la facturación de Novex se
            implementarán en el apartado
            12. No se muestra un estado
            ficticio hasta entonces.
          </p>
        </section>
      </div>
    </div>
  );
}
