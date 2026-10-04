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
        { status: 500 }
      );
    }

    const body = await request.json();

    const credentials = Buffer.from(
      `${publicKey}:${secretKey}`
    ).toString("base64");

    const sendcloudBody = {
      from_address: {
        name: body.customerName,
        address_line_1: body.customerAddress,
        house_number: body.customerHouseNumber,
        postal_code: body.customerPostalCode,
        city: body.customerCity,
        country_code: "ES",
        phone_number: body.customerPhone,
        email: body.customerEmail,
      },

      to_address: {
        name: "Novex Demo Store",
        company_name: "Novex Demo",
        address_line_1: body.storeAddress,
        house_number: body.storeHouseNumber,
        postal_code: body.storePostalCode,
        city: body.storeCity,
        country_code: "ES",
      },

      ship_with: {
        type: "shipping_option_code",
        shipping_option_code: "correos:paqretorno/return",
        contract: 8957,
      },

      weight: {
        value: body.weight ?? 1,
        unit: "kg",
      },

      collo_count: 1,

      send_tracking_emails: false,

      order_number: body.orderNumber,

      external_reference: `NOVEX-RETURN-${body.caseId}`,

      delivery_option: "drop_off_point",
    };

    const response = await fetch(
      "https://panel.sendcloud.sc/api/v3/returns",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(sendcloudBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          message: "Sendcloud no pudo crear la devolución.",
          sendcloud: data,
        },
        {
          status: response.status,
        }
      );
    }

    return Response.json({
      success: true,
      message: "Devolución creada correctamente en Sendcloud.",
      returnId: data.return_id,
      parcelId: data.parcel_id,
      multiColloIds: data.multi_collo_ids,
    });
  } catch (error) {
    console.error("Sendcloud create return error:", error);

    return Response.json(
      {
        success: false,
        message: "Error interno al crear la devolución.",
      },
      {
        status: 500,
      }
    );
  }
}