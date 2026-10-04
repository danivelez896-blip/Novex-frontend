export async function GET() {
  const response = await fetch(
    "https://novex-production-f614.up.railway.app/api/return-rules",
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  return Response.json(data, {
    status: response.status,
  });
}