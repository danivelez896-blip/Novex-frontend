import { novexRouteFetch } from "@/lib/novex-route";
export async function POST(_request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  if (process.env.NOVEX_ENABLE_STAGING_SENDCLOUD_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Simulación disponible solo en Staging" }, { status: 403 });
  }
  const { caseId } = await params;
  if (!/^\d+$/.test(caseId)) return Response.json({ message: "Caso inválido" }, { status: 400 });
  const response = await novexRouteFetch(`/cases/${caseId}/staging/simulate-replacement`, { method: "POST" });
  const body = await response.json().catch(() => ({ message: "Error inesperado" }));
  return Response.json(body, { status: response.status });
}
