import { novexRouteFetch } from "@/lib/novex-route";
export async function POST(request: Request) {
  if (process.env.NOVEX_ENABLE_STAGING_SENDCLOUD_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Simulación solo disponible en Staging" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !Number.isSafeInteger(body.caseId) ||
      !["CREATE", "RECEIVE"].includes(body.action)) {
    return Response.json({ message: "Solicitud de simulación no válida" }, { status: 400 });
  }
  const response = await novexRouteFetch("/shipments/staging/simulate-exchange-return", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId: body.caseId, action: body.action }),
  });
  const data = await response.json().catch(() => ({ message: "Error al procesar simulación" }));
  return Response.json(data, { status: response.status });
}
