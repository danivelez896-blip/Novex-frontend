export async function POST(request: Request) {
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

    const body = await request.json();

    const credentials = Buffer.from(
      `${publicKey}:${secretKey}`
    ).toString("base64");

    const response = await fetch(
      "https://panel.sendcloud.sc/api/v3/shipping-options",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          from_address: {
            country_code: "ES",
            postal_code: body.fromPostalCode,
            city: body.fromCity,
            address_line_1: body.fromAddress,
          },

          to_address: {
            country_code: "ES",
            postal_code: body.toPostalCode,
            city: body.toCity,
            address_line_1: body.toAddress,
          },

          parcels: [
            {
              weight: {
                value: body.weight ?? "1",
                unit: "kg",
              },
            },
          ],

          calculate_quotes: true,

          functionalities: {
            returns: true,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          message:
            "No se pudieron consultar las opciones de devolución.",
          sendcloud: data,
        },
        {
          status: response.status,
        }
      );
    }

    return Response.json({
      success: true,
      options: data,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message:
          "Error al consultar las opciones de devolución.",
      },
      {
        status: 500,
      }
    );
  }
}