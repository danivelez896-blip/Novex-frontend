export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      "http://localhost:3002/api/shipments/sendcloud/create-return",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Error creando devolución Sendcloud:",
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