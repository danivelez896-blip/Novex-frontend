import { novexRouteFetch } from "@/lib/novex-route";

export async function POST(
  _request: Request,
  context: {
    params: Promise<{
      storeId: string;
    }>;
  }
) {
  const { storeId } =
    await context.params;

  const parsedStoreId =
    Number(storeId);

  if (
    !Number.isInteger(
      parsedStoreId
    ) ||
    parsedStoreId <= 0
  ) {
    return Response.json(
      {
        message:
          "Tienda no válida.",
      },
      { status: 400 }
    );
  }

  const response =
    await novexRouteFetch(
      `/orders/shopify/${parsedStoreId}/sync`,
      {
        method: "POST",
      }
    );

  const body =
    await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get(
          "content-type"
        ) ??
        "application/json",
    },
  });
}
