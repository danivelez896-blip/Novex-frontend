export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const response = await fetch(
    `https://novex-production-f614.up.railway.app/api/orders/${id}`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  return Response.json(data, {
    status: response.status,
  });
}