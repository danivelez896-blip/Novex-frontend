import { novexRouteFetch } from "@/lib/novex-route";

export async function GET(_request: Request, { params }: { params: Promise<{ storeId: string; methodId: string }> }) {
  if (process.env.NOVEX_ENABLE_STAGING_SENDCLOUD_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Solo disponible en Staging" }, { status: 403 });
  }
  const { storeId, methodId } = await params;
  if (!/^\d+$/.test(storeId) || !/^\d+$/.test(methodId)) {
    return Response.json({ message: "ID no válido" }, { status: 400 });
  }
  const response = await novexRouteFetch(`/integrations/stores/${storeId}/sendcloud/compat/${methodId}`);
  const data = await response.json().catch(() => ({ message: "Respuesta inesperada de Sendcloud" }));
  return Response.json(data, { status: response.status });
}
