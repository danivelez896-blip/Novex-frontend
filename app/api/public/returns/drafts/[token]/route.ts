const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      token: string;
    }>;
  }
) {
  const { token } =
    await params;

  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/public/returns/drafts/${encodeURIComponent(token)}`,
    {
      cache: "no-store",
    }
  );

  const data =
    await response.json();

  return Response.json(data, {
    status: response.status,
  });
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      token: string;
    }>;
  }
) {
  const { token } =
    await params;
  const body =
    await request.json();

  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/public/returns/drafts/${encodeURIComponent(token)}`,
    {
      method: "PATCH",
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
