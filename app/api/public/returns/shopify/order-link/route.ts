import { proxyPortalRequest } from "../../../../../../lib/portal-route.ts";

export async function POST(request: Request) {
  return proxyPortalRequest(request, "shopify/order-link");
}
