import { novexRouteFetch } from "@/lib/novex-route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  if (process.env.NOVEX_ENABLE_STAGING_SENDCLOUD_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Función solo disponible en Staging" }, { status: 403 });
  }
  const { storeId } = await params;
  if (!/^\d+$/.test(storeId)) {
    return Response.json({ message: "Tienda no válida" }, { status: 400 });
  }
  const response = await novexRouteFetch(`/integrations/stores/${storeId}/sendcloud/contracts`);
  if (!response.ok) {
    return Response.json({ message: "No se pudieron consultar los contratos de Sendcloud" }, { status: response.status });
  }
  const data = await response.json();
  return Response.json(data);
}
