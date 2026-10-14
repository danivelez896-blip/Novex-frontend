import { novexRouteFetch } from "@/lib/novex-route";
export async function POST(request: Request) {
  if (process.env.NOVEX_ENABLE_STAGING_SENDCLOUD_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Solo disponible en Staging" }, { status: 403 });
  }
  const data = await request.json().catch(() => null);
  if (!data || !Number.isSafeInteger(data.caseId) || data.caseId <= 0) {
    return Response.json({ message: "Caso inválido" }, { status: 400 });
  }
  const response = await novexRouteFetch("/shipments/sendcloud/validate-return", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId: data.caseId, weight: 0.4 }),
  });
  const body = await response.json().catch(() => ({ message: "Respuesta inesperada" }));
  return Response.json(body, { status: response.status });
}
