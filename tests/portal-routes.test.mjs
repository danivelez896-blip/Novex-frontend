import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { GET as order } from "../app/api/public/returns/orders/[publicId]/route.ts";
import { POST as draft } from "../app/api/public/returns/orders/[publicId]/drafts/route.ts";
import { POST as createCase } from "../app/api/public/returns/orders/[publicId]/cases/route.ts";
import { GET as caseStatus } from "../app/api/public/returns/cases/[publicId]/route.ts";
import { GET as getDraft, PATCH as saveDraft } from "../app/api/public/returns/drafts/[token]/route.ts";
import { POST as orderLink } from "../app/api/public/returns/shopify/order-link/route.ts";
const originalFetch = globalThis.fetch;
const originalEnv = process.env.NOVEX_API_URL;
beforeEach(() => { process.env.NOVEX_API_URL = "https://backend.invalid"; });
afterEach(() => { globalThis.fetch = originalFetch; if (originalEnv === undefined) delete process.env.NOVEX_API_URL; else process.env.NOVEX_API_URL = originalEnv; });
const routes = [ [order, "GET", "orders/known", { publicId: "known" }], [draft, "POST", "orders/known/drafts", { publicId: "known" }],
  [createCase, "POST", "orders/known/cases", { publicId: "known" }], [caseStatus, "GET", "cases/known", { publicId: "known" }],
  [getDraft, "GET", "drafts/known", { token: "known" }], [saveDraft, "PATCH", "drafts/known", { token: "known" }], [orderLink, "POST", "shopify/order-link", {}] ];
const request = (method, authenticated = true) => new Request("https://portal.invalid/api", { method,
  headers: authenticated ? { Authorization: "Bearer header.payload.signature", Cookie: "admin=must-not-forward", "Content-Type": "application/json" } : {},
  ...(method === "GET" ? {} : { body: JSON.stringify({ payload: { selected: true } }) }) });
for (const [handler, method, path, params] of routes) {
  test(`BFF ${method} ${path} preserves the authorization contract`, async () => {
    let calls = 0;
    globalThis.fetch = async (url, init) => {
      calls++; assert.equal(url, `https://backend.invalid/api/public/returns/${path}`);
      assert.equal(init.headers.get("authorization"), "Bearer header.payload.signature");
      assert.equal(init.headers.has("cookie"), false); assert.equal(init.cache, "no-store"); assert.equal(init.redirect, "error");
      if (method !== "GET") assert.deepEqual(JSON.parse(init.body), { payload: { selected: true } });
      return Response.json({ message: "denied" }, { status: 404 });
    };
    const response = await handler(request(method), { params: Promise.resolve(params) });
    assert.equal(response.status, 404); assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer"); assert.equal(response.headers.get("vary"), "Authorization"); assert.equal(calls, 1);
    const rejected = await handler(request(method, false), { params: Promise.resolve(params) });
    assert.equal(rejected.status, 401); assert.equal(calls, 1);
  });
}
test("BFF requires an explicit backend and never falls back to production", async () => {
  delete process.env.NOVEX_API_URL;
  globalThis.fetch = async () => assert.fail("No production fallback");
  assert.equal((await order(request("GET"), { params: Promise.resolve({ publicId: "known" }) })).status, 503);
});
test("BFF sanitizes unknown outcomes and malformed responses without retrying", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("private-provider-secret"); };
  const response = await createCase(request("POST"), { params: Promise.resolve({ publicId: "known" }) });
  assert.equal(response.status, 503); assert.equal(calls, 1); assert.ok(!(await response.text()).includes("private-provider-secret"));
  globalThis.fetch = async () => new Response("not-json");
  assert.equal((await order(request("GET"), { params: Promise.resolve({ publicId: "known" }) })).status, 502);
});
test("oversized, malformed and non-JSON mutations cannot reach the backend", async () => {
  globalThis.fetch = async () => assert.fail("Invalid body must not be forwarded");
  for (const [body, type, status] of [["{}", "text/plain", 400], ["not-json", "application/json", 400], [JSON.stringify({ payload: "x".repeat(66_000) }), "application/json", 413]]) {
    const req = new Request("https://portal.invalid/api", { method: "POST", headers: { Authorization: "Bearer header.payload.signature", "Content-Type": type }, body });
    assert.equal((await createCase(req, { params: Promise.resolve({ publicId: "known" }) })).status, status);
  }
});
test("resource path traversal cannot leave the public portal namespace", async () => {
  globalThis.fetch = async () => assert.fail("No escaped resource request");
  for (const publicId of ["..", "../refunds", "a/b", "a?token=secret"]) assert.equal((await order(request("GET"), { params: Promise.resolve({ publicId }) })).status, 400);
});
