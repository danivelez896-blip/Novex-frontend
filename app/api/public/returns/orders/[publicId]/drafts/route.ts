const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      publicId: string;
    }>;
  }
) {
  const { publicId } =
    await params;
  const body =
    await request.json();

  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/public/returns/orders/${encodeURIComponent(publicId)}/drafts`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const data =
    await response.json();

  return Response.json(data, {
    status: response.status,
  });
}
