// Optional cross-repository integration: imports the already built backend.
// No backend files, sockets, credentials or databases are modified.
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { GET as order } from "../app/api/public/returns/orders/[publicId]/route.ts";
import { POST as draft } from "../app/api/public/returns/orders/[publicId]/drafts/route.ts";
import { POST as createCase } from "../app/api/public/returns/orders/[publicId]/cases/route.ts";
import { GET as caseStatus } from "../app/api/public/returns/cases/[publicId]/route.ts";
import { GET as getDraft, PATCH as saveDraft } from "../app/api/public/returns/drafts/[token]/route.ts";
const backendRoot = resolve(process.env.NOVEX_BACKEND_ROOT ?? "../Novex");
const requireBackend = createRequire(resolve(backendRoot, "package.json"));
const backend = name => requireBackend(resolve(backendRoot, `dist/src/return-portal/${name}.js`));
const { issuePortalOrderToken } = backend("portal-authorization");
const { ReturnPortalService } = backend("return-portal.service");
const { ReturnPortalController } = backend("return-portal.controller");
const { ReturnPortalGuard } = backend("return-portal.guard");
const { Reflector } = requireBackend("@nestjs/core");
const config = { secret: "synthetic-contract-only", clientId: "synthetic-app" };
const scope = { orderPublicId: "order1", storeId: 2, customerId: 3, customerExternalId: "gid://shopify/Customer/3", shopDomain: "store.myshopify.com" };
const originalFetch = globalThis.fetch, originalEndpoint = process.env.NOVEX_API_URL;
afterEach(() => { globalThis.fetch = originalFetch; if (originalEndpoint === undefined) delete process.env.NOVEX_API_URL; else process.env.NOVEX_API_URL = originalEndpoint; });
const routes = [ [order, "GET", "getOrder", { publicId: "order1" }], [draft, "POST", "createDraft", { publicId: "order1" }],
  [createCase, "POST", "createCase", { publicId: "order1" }], [caseStatus, "GET", "getCase", { publicId: "case1" }],
  [getDraft, "GET", "getDraft", { token: "rtd_test" }], [saveDraft, "PATCH", "updateDraft", { token: "rtd_test" }] ];
function fixture() {
  const order = { id: 1, publicId: "order1", storeId: 2, customerId: 3, customer: { id: 3, storeId: 2, externalCustomerId: scope.customerExternalId },
    store: { id: 2, domain: scope.shopDomain, platform: "SHOPIFY", status: "CONNECTED", company: { status: "ACTIVE" } } };
  const db = { store: { findMany: async () => [{ id: 2 }] }, order: { findUnique: async () => order },
    returnDraft: { findUnique: async () => ({ orderId: 1, order, case: null }) }, case: { findUnique: async () => ({ storeId: 2, customerId: 3, order }) } };
  const service = new ReturnPortalService(db); service.portalConfig = () => config;
  const guard = new ReturnPortalGuard(new Reflector(), service);
  process.env.NOVEX_API_URL = "https://backend.invalid";
  let method;
  globalThis.fetch = async (url, init) => {
    assert.ok(url.startsWith("https://backend.invalid/api/public/returns/"));
    const headers = {}, request = { params: { publicId: "known", token: "known" }, headers: { authorization: init.headers.get("authorization") } };
    try {
      await guard.canActivate({ getHandler: () => ReturnPortalController.prototype[method], switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({ setHeader: (key, value) => { headers[key] = value; } }) }) });
      assert.equal(request.novexPortalAccess.orderId, 1);
      return Response.json({ permitted: true }, { headers });
    } catch (error) { return Response.json({ permitted: false }, { status: error.getStatus?.() ?? 500, headers }); }
  };
  return { order, invoke: async (route, token) => {
    const [handler, httpMethod, backendMethod, params] = route; method = backendMethod;
    return handler(new Request("https://portal.invalid/api", { method: httpMethod, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(httpMethod === "GET" ? {} : { body: "{}" }) }), { params: Promise.resolve(params) });
  } };
}
test("frontend routes accept real backend-issued grants through the real resource guard", async () => {
  const f = fixture(), grant = issuePortalOrderToken(scope, config);
  for (const route of routes) assert.equal((await f.invoke(route, grant.accessToken)).status, 200);
});
test("frontend propagates real backend signature and expiry failures as 401", async () => {
  const f = fixture();
  const grant = issuePortalOrderToken(scope, config);
  const [header, payload, signature] = grant.accessToken.split(".");
  const invalid = `${header}.${payload}.${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;
  const expired = issuePortalOrderToken(scope, config, Math.floor(Date.now()/1000) - 1000);
  for (const route of routes) {
    assert.equal((await f.invoke(route, invalid)).status, 401);
    assert.equal((await f.invoke(route, expired.accessToken)).status, 401);
  }
});
test("frontend never bypasses backend order, customer, store or company isolation", async () => {
  const grant = issuePortalOrderToken(scope, config);
  for (const mutate of [f => f.order.publicId = "other", f => f.order.customerId = 99, f => f.order.storeId = 99, f => f.order.store.company.status = "SUSPENDED"]) {
    const f = fixture(); mutate(f);
    for (const route of routes) assert.equal((await f.invoke(route, grant.accessToken)).status, 404);
  }
});
