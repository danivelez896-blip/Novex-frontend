import { configuredEndpoint } from "./staging-endpoints.ts";

export const portalResponseHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "Vary": "Authorization",
};

export function portalJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: portalResponseHeaders });
}

export function portalAuthorization(request: Request) {
  const value = request.headers.get("authorization");
  return value && /^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value) && value.length <= 8199 ? value : null;
}

export async function portalBackendFetch(request: Request, path: string, init: RequestInit = {}) {
  const authorization = portalAuthorization(request);
  if (!authorization) return portalJson({ message: "Vuelve a abrir la devolución desde tu cuenta de la tienda." }, 401);
  if (!/^(?:shopify\/order-link|orders\/[A-Za-z0-9_-]{1,200}(?:\/(?:drafts|cases))?|cases\/[A-Za-z0-9_-]{1,200}|drafts\/[A-Za-z0-9_-]{1,200}(?:\/photos)?)$/.test(path)) {
    return portalJson({ message: "Referencia del portal inválida." }, 400);
  }
  const apiUrl = configuredEndpoint(process.env.NOVEX_API_URL);
  if (!apiUrl) return portalJson({ message: "Portal no disponible temporalmente." }, 503);
  const headers = new Headers(init.headers);
  headers.set("Authorization", authorization);
  try {
    return await fetch(`${apiUrl}/api/public/returns/${path}`, {
      ...init, headers, cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // A mutation with a lost response must never be retried automatically.
    return portalJson({ message: "No se pudo confirmar la respuesta. Comprueba el estado antes de volver a enviar." }, 503);
  }
}

async function readPortalJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json") || !request.body) throw new Error("JSON required");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let total = 0, text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 64 * 1024) { await reader.cancel(); throw new RangeError("JSON too large"); }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}

export async function proxyPortalRequest(request: Request, path: string) {
  if (!portalAuthorization(request)) return portalJson({ message: "Acceso al portal requerido." }, 401);
  const init: RequestInit = { method: request.method };
  if (request.method !== "GET") {
    try {
      init.body = JSON.stringify(await readPortalJson(request));
      init.headers = { "Content-Type": "application/json" };
    } catch (error) { return portalJson({ message: "Solicitud inválida." }, error instanceof RangeError ? 413 : 400); }
  }
  const response = await portalBackendFetch(request, path, init);
  try { return portalJson(await response.json(), response.status); }
  catch { return portalJson({ message: "Respuesta del portal no disponible." }, 502); }
}
