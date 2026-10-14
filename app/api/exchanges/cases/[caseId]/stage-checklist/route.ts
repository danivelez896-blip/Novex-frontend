import { novexRouteFetch } from "@/lib/novex-route";
export async function GET(_request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  if (!/^\d+$/.test(caseId)) return Response.json({ message: "Caso no válido" }, { status: 400 });
  const response = await novexRouteFetch(`/cases/${caseId}/exchange-stage-checklist`);
  const data = await response.json().catch(() => ({ message: "Respuesta inesperada" }));
  return Response.json(data, { status: response.status });
}
