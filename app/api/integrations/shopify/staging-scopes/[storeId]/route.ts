import { novexRouteFetch } from "@/lib/novex-route";
export async function GET(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  if (process.env.NOVEX_ENABLE_STAGING_SHOPIFY_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Solo disponible en Novex Staging" }, { status: 403 });
  }
  const { storeId } = await params;
  if (!/^\d+$/.test(storeId)) return Response.json({ message: "Tienda no válida" }, { status: 400 });
  const response = await novexRouteFetch(`/integrations/stores/${storeId}/shopify/scopes-audit`);
  const data = await response.json().catch(() => ({ message: "Respuesta inesperada" }));
  return Response.json(data, { status: response.status });
}
