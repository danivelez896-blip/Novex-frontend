import { novexRouteFetch } from "@/lib/novex-route";
export async function GET(_request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  if (!/^\d+$/.test(caseId) || !process.env.NOVEX_API_URL?.includes("diligent-reverence-staging.up.railway.app")) {
    return Response.json({ message: "Laboratorio exclusivo de Staging" }, { status: 403 });
  }
  const response = await novexRouteFetch(`/cases/${caseId}/staging/lifecycle-lab`);
  const data = await response.json().catch(() => ({ message: "Respuesta inesperada" }));
  return Response.json(data, { status: response.status });
}
