import { proxyPortalRequest } from "../../../../../../lib/portal-route.ts";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return proxyPortalRequest(request, `drafts/${encodeURIComponent(token)}`);
}
export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return proxyPortalRequest(request, `drafts/${encodeURIComponent(token)}`);
}
