import { proxyPortalRequest } from "../../../../../../../lib/portal-route.ts";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  return proxyPortalRequest(request, `orders/${encodeURIComponent(publicId)}/drafts`);
}
