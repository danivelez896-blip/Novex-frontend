import { novexRouteFetch } from "@/lib/novex-route";

export async function POST(request: Request) {
  if (process.env.NOVEX_ENABLE_STAGING_SHOPIFY_CONNECT !== "true" ||
      process.env.NODE_ENV === "production") {
    return Response.json({ message: "Conexión Shopify de pruebas no habilitada" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !Number.isSafeInteger(body.storeId) || body.storeId <= 0) {
    return Response.json({ message: "Tienda no válida" }, { status: 400 });
  }
  const shop = "novex-dev.myshopify.com";
  const response = await novexRouteFetch(
    `/integrations/stores/${body.storeId}/shopify/oauth/start?shop=${encodeURIComponent(shop)}`,
  );
  const data = await response.json().catch(() => ({ message: "Respuesta Shopify no válida" }));
  if (!response.ok) return Response.json(data, { status: response.status });
  const url = typeof data.authorizationUrl === "string" ? data.authorizationUrl : "";
  if (!url.startsWith(`https://${shop}/admin/oauth/authorize?`)) {
    return Response.json({ message: "URL OAuth inesperada" }, { status: 502 });
  }
  return Response.json({ authorizationUrl: url });
}
