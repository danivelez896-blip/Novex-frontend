import { novexRouteFetch } from "@/lib/novex-route";

export async function POST(request: Request,
  { params }: { params: Promise<{ storeId: string }> }) {
  if (process.env.NOVEX_ENABLE_STAGING_SENDCLOUD_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Configuración disponible solo en Staging" }, { status: 403 });
  }
  const { storeId } = await params;
  if (!/^\d+$/.test(storeId)) return Response.json({ message: "Tienda no válida" }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ message: "Datos incompletos" }, { status: 400 });
  }
  const response = await novexRouteFetch(`/integrations/stores/${storeId}/sendcloud/return-settings`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({ message: "Respuesta inesperada del backend" }));
  return Response.json(data, { status: response.status });
}
