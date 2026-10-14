import { novexRouteFetch } from "@/lib/novex-route";
export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  if (caseId !== "3" || process.env.NOVEX_ENABLE_STAGING_SHOPIFY_CONNECT !== "true" ||
      !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Solo se permite el Caso #3 en Staging" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (body?.confirmation !== "CONFIRMO-DEVOLUCION-1007") {
    return Response.json({ message: "Falta confirmación expresa" }, { status: 400 });
  }
  const response = await novexRouteFetch(`/cases/${caseId}/staging/authorized-return-create`, {
    method: "POST", body: JSON.stringify({ confirmation: body.confirmation }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => ({ message: "Respuesta inesperada" }));
  return Response.json(data, { status: response.status });
}
