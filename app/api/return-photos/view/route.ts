import { viewReturnPhoto } from "../../../../lib/portal-photos.ts";
import { novexRouteFetch } from "@/lib/novex-route";

export async function GET(request: Request) {
  return viewReturnPhoto(request, id => novexRouteFetch(`/cases/${id}`));
}
