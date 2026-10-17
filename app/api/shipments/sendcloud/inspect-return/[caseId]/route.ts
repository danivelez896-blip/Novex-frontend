import { novexRouteFetch } from "@/lib/novex-route";
export async function GET(_request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  if (process.env.NOVEX_ENABLE_STAGING_SENDCLOUD_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Solo disponible en Staging" }, { status: 403 });
  }
  const { caseId } = await params;
  if (!/^\d+$/.test(caseId)) return Response.json({ message: "Caso no válido" }, { status: 400 });
  const response = await novexRouteFetch(`/shipments/sendcloud/inspect-return/${caseId}`);
  const data = await response.json().catch(() => ({ message: "Respuesta inválida" }));
  return Response.json(data, { status: response.status });
}
