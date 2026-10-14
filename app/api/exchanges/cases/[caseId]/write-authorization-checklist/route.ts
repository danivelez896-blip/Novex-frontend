import { novexRouteFetch } from "@/lib/novex-route";
export async function GET(_request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  if (process.env.NOVEX_ENABLE_STAGING_SHOPIFY_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Solo Novex Staging" }, { status: 403 });
  }
  const { caseId } = await params;
  if (caseId !== "3") return Response.json({ message: "Solo Caso #3" }, { status: 403 });
  const response = await novexRouteFetch(`/cases/${caseId}/staging/write-authorization-checklist`);
  const body = await response.json().catch(() => ({ message: "Respuesta inesperada" }));
  return Response.json(body, { status: response.status });
}
