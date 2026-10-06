const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

export async function GET(
  _request: Request,
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

  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/public/returns/orders/${encodeURIComponent(publicId)}`,
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
