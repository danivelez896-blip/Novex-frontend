type Company = {
  id: number;
  name: string;
};

type Store = {
  id: number;
  name: string;
  domain: string | null;
  platform: string;
  companyId: number;
};

async function getSettingsData() {
  const [storesResponse, companiesResponse] = await Promise.all([
    fetch(
      "https://novex-production-f614.up.railway.app/api/stores",
      {
        cache: "no-store",
      }
    ),
    fetch(
      "https://novex-production-f614.up.railway.app/api/companies",
      {
        cache: "no-store",
      }
    ),
  ]);

  if (!storesResponse.ok || !companiesResponse.ok) {
    throw new Error("No se pudo cargar la configuración");
  }

  const stores: Store[] = await storesResponse.json();
  const companies: Company[] = await companiesResponse.json();

  return {
    store: stores[0] ?? null,
    company: companies[0] ?? null,
  };
}

export default async function SettingsPage() {
  const { store, company } = await getSettingsData();

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Sistema</p>

        <h1 className="mt-1 text-3xl font-semibold">
          Configuración
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Configuración general de la tienda y de Novex
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-medium">
            Tienda
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-zinc-500">
                Nombre
              </p>

              <p className="mt-1 text-sm">
                {store?.name ?? "Sin tienda"}
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

              <p className="mt-1 text-sm">
                {store?.domain ?? "-"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-medium">
            Empresa
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-zinc-500">
                Nombre
              </p>

              <p className="mt-1 text-sm">
                {company?.name ?? "Sin empresa"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Estado
              </p>

              <span className="mt-2 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                Activa
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-medium">
            Integraciones
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div>
                <p className="text-sm font-medium">
                  Shopify
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Sincronización de pedidos
                </p>
              </div>

              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                Pendiente
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div>
                <p className="text-sm font-medium">
                  Sendcloud
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Envíos y etiquetas
                </p>
              </div>

              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                Pendiente
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-medium">
            Pagos
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div>
                <p className="text-sm font-medium">
                  Stripe
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Reembolsos automáticos
                </p>
              </div>

              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                No configurado
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div>
                <p className="text-sm font-medium">
                  PayPal
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Reembolsos
                </p>
              </div>

              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                No configurado
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}