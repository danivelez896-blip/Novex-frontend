export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      caseId: string;
    }>;
  }
) {
  try {
    const { caseId } = await params;

    const backendUrl =
      process.env.NOVEX_API_URL ??
      "http://localhost:3002";

    const response = await fetch(
      `${backendUrl}/api/refunds/shopify/${caseId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Error creando reembolso Shopify:",
      error
    );

    return Response.json(
      {
        message:
          "No se pudo conectar con el backend de Novex.",
      },
      {
        status: 500,
      }
    );
  }
}