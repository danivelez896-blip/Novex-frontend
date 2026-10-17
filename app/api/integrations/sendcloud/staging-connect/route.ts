import { novexRouteFetch } from "@/lib/novex-route";

export async function POST(request: Request) {
  if (process.env.NOVEX_ENABLE_STAGING_SENDCLOUD_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Conexión de pruebas deshabilitada" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !Number.isSafeInteger(body.storeId) || body.storeId <= 0 ||
      typeof body.publicKey !== "string" || typeof body.secretKey !== "string" ||
      !body.publicKey.trim() || !body.secretKey.trim()) {
    return Response.json({ message: "Rellena ambas claves de Sendcloud" }, { status: 400 });
  }
  const response = await novexRouteFetch(
    `/integrations/stores/${body.storeId}/sendcloud/connect`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: body.publicKey.trim(), secretKey: body.secretKey.trim() }) },
  );
  if (!response.ok) {
    return Response.json({ message: "No se pudo validar la conexión de Sendcloud. Comprueba las claves y la configuración del backend." }, { status: response.status });
  }
  return Response.json({ success: true });
}
