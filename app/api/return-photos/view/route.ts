export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      return Response.json(
        {
          message: "Falta la configuración de Supabase.",
        },
        {
          status: 500,
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return Response.json(
        {
          message: "Falta la ruta de la imagen.",
        },
        {
          status: 400,
        }
      );
    }

    const encodedPath = path
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/authenticated/return-photos/${encodedPath}`,
      {
        headers: {
          apikey: supabaseSecretKey,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const error = await response.text();

      console.error(
        "Error al obtener imagen:",
        error
      );

      return Response.json(
        {
          message: "No se pudo cargar la imagen.",
        },
        {
          status: response.status,
        }
      );
    }

    const image = await response.arrayBuffer();

    return new Response(image, {
      headers: {
        "Content-Type":
          response.headers.get("content-type") ??
          "image/jpeg",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        message: "Error al cargar la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}   