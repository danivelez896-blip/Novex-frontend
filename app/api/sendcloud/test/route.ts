export async function GET() {
  try {
    const publicKey = process.env.SENDCLOUD_PUBLIC_KEY;
    const secretKey = process.env.SENDCLOUD_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return Response.json(
        {
          success: false,
          message: "Faltan las credenciales de Sendcloud.",
        },
        {
          status: 500,
        }
      );
    }

    const credentials = Buffer.from(
      `${publicKey}:${secretKey}`
    ).toString("base64");

    const response = await fetch(
      "https://panel.sendcloud.sc/api/v2/parcels?limit=1",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${credentials}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const error = await response.text();

      console.error("Sendcloud error:", error);

      return Response.json(
        {
          success: false,
          status: response.status,
          message: "No se pudo conectar con Sendcloud.",
          error,
        },
        {
          status: response.status,
        }
      );
    }

    const data = await response.json();

    return Response.json({
      success: true,
      message: "Conexión con Sendcloud correcta.",
      sendcloud: data,
    });
  } catch (error) {
    console.error("Sendcloud connection error:", error);

    return Response.json(
      {
        success: false,
        message: "Error al conectar con Sendcloud.",
      },
      {
        status: 500,
      }
    );
  }
}