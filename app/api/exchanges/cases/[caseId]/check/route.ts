import { novexRouteFetch } from "@/lib/novex-route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  if (!/^\d+$/.test(caseId)) {
    return Response.json({ message: "Caso no válido" }, { status: 400 });
  }
  const response = await novexRouteFetch(`/cases/${caseId}/exchange-check`);
  const data = await response.json().catch(() => ({
    message: "El backend no devolvió JSON válido",
  }));
  return Response.json(data, { status: response.status });
}
