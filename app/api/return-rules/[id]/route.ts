import { novexRouteFetch } from "@/lib/novex-route";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;
  const body =
    await request.json();

  const response =
    await novexRouteFetch(
      `/return-rules/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(body),
      }
    );

  const data =
    await response.json();

  return Response.json(data, {
    status: response.status,
  });
}
