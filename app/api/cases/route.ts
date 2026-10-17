import { novexRouteFetch } from "@/lib/novex-route";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "JSON no válido" }, { status: 400 });
  }

  const response = await novexRouteFetch("/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({
    message: "Respuesta del backend no válida",
  }));
  return Response.json(data, { status: response.status });
}
