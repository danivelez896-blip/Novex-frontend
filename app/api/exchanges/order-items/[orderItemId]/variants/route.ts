import { novexRouteFetch } from "@/lib/novex-route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderItemId: string }> },
) {
  const { orderItemId } = await params;
  if (!/^\d+$/.test(orderItemId)) {
    return Response.json({ message: "ID no válido" }, { status: 400 });
  }
  const response = await novexRouteFetch(
    `/integrations/order-items/${orderItemId}/shopify/variants`,
  );
  const data = await response.json().catch(() => ({
    message: "Respuesta no válida del backend",
  }));
  return Response.json(data, { status: response.status });
}
