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
      "https://panel.sendcloud.sc/api/v3/contracts?is_active=true",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${credentials}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          message: "No se pudieron consultar los contratos.",
          sendcloud: data,
        },
        {
          status: response.status,
        }
      );
    }

    return Response.json({
      success: true,
      contracts: data,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Error al consultar Sendcloud.",
      },
      {
        status: 500,
      }
    );
  }
}