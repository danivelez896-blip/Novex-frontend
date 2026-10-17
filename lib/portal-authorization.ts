// A portal grant stays in memory and travels only in Authorization headers.
// The backend validates its signature, tenant, customer and resource ownership.
let accessToken: string | null = null;
let orderPublicId: string | null = null;
let expiresAt = 0;

export const PORTAL_AUTH_REQUIRED = "novex:portal-auth-required";
export const PORTAL_AUTH_MESSAGE = "Tu acceso ha caducado o no es válido. Vuelve a abrir la devolución desde tu cuenta de la tienda.";

export function clearPortalAccess() {
  accessToken = null;
  orderPublicId = null;
  expiresAt = 0;
}

export function initializePortalAccess(location: Pick<Location, "hash" | "pathname" | "search">, history: Pick<History, "replaceState" | "state">) {
  const query = new URLSearchParams(location.search);
  if (query.has("access_token")) {
    query.delete("access_token");
    history.replaceState(history.state, "", `${location.pathname}${query.size ? `?${query}` : ""}`);
    clearPortalAccess();
    return false;
  }
  const fragment = new URLSearchParams(location.hash.slice(1));
  if (fragment.has("access_token")) {
    const tokens = fragment.getAll("access_token");
    fragment.delete("access_token");
    const rest = fragment.toString();
    history.replaceState(history.state, "", `${location.pathname}${location.search}${rest ? `#${rest}` : ""}`);
    clearPortalAccess();
    try {
      const token = tokens.length === 1 ? tokens[0] : "";
      if (!token || token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new Error();
      const claims = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (claims.aud !== "novex:return-portal:v1" || typeof claims.orderPublicId !== "string" || !claims.orderPublicId || !Number.isSafeInteger(claims.exp) || claims.exp * 1000 <= Date.now()) throw new Error();
      accessToken = token;
      orderPublicId = claims.orderPublicId;
      expiresAt = claims.exp * 1000;
    } catch {
      clearPortalAccess();
    }
  }
  const order = /^\/return\/(?!mobile\/)([^/]+)/.exec(location.pathname)?.[1];
  try { if (order && decodeURIComponent(order) !== orderPublicId) clearPortalAccess(); }
  catch { clearPortalAccess(); }
  return hasPortalAccess();
}

export function hasPortalAccess() {
  if (expiresAt <= Date.now()) clearPortalAccess();
  return accessToken !== null;
}

export function portalHandoffUrl(path: string, origin: string) {
  if (!/^\/return\/mobile\/[A-Za-z0-9_-]+$/.test(path) || !hasPortalAccess()) throw new Error(PORTAL_AUTH_MESSAGE);
  const url = new URL(path, origin);
  if (url.origin !== new URL(origin).origin) throw new Error(PORTAL_AUTH_MESSAGE);
  url.hash = new URLSearchParams({ access_token: accessToken! }).toString();
  return url.toString();
}

export async function portalFetch(path: string, init: RequestInit = {}) {
  const valid = /^\/api\/public\/returns\/(?:orders\/[^/]+(?:\/(?:cases|drafts))?|drafts\/[^/]+|cases\/[^/]+)$/.test(path) || path === "/api/return-photos";
  const url = new URL(path, "https://portal.invalid");
  if (!valid || url.pathname !== path || path.includes("\\") || path.includes("#") || path.includes("?") || /%2f|%5c/i.test(path)) throw new Error("Ruta del portal inválida");
  if (!hasPortalAccess()) {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(PORTAL_AUTH_REQUIRED));
    throw new Error(PORTAL_AUTH_MESSAGE);
  }
  const headers = new Headers(init.headers);
  const sentToken = accessToken;
  headers.set("Authorization", `Bearer ${sentToken}`);
  const response = await fetch(path, { ...init, headers, cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer", signal: init.signal ?? AbortSignal.timeout(path === "/api/return-photos" ? 60_000 : 25_000) });
  if (response.status === 401 && sentToken === accessToken) {
    clearPortalAccess();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(PORTAL_AUTH_REQUIRED));
  }
  return response;
}
