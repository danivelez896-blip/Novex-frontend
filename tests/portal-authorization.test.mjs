import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initializePortalAccess, hasPortalAccess, clearPortalAccess, portalFetch, portalHandoffUrl } from "../lib/portal-authorization.ts";

const originalFetch = globalThis.fetch;
const issuedAt = Math.floor(Date.now()/1000);
beforeEach(clearPortalAccess);
afterEach(() => { globalThis.fetch = originalFetch; clearPortalAccess(); });
export function grant(overrides = {}) {
  return [ { alg: "HS256", typ: "NOVEX-PORTAL" }, { aud: "novex:return-portal:v1", orderPublicId: "order1", exp: issuedAt + 600, ...overrides }, "signature" ]
    .map((x, i) => i === 2 ? Buffer.from(x).toString("base64url") : Buffer.from(JSON.stringify(x)).toString("base64url")).join(".");
}
function open(hash = `#access_token=${grant()}`, pathname = "/return/order1", search = "") {
  let replacement;
  const ready = initializePortalAccess({ hash, pathname, search }, { state: { state: "preserved" }, replaceState(state, _, path) { assert.deepEqual(state, { state: "preserved" }); replacement = path; } });
  return { ready, replacement };
}
test("fragment grant is removed from history and never persisted", () => {
  assert.deepEqual(open(), { ready: true, replacement: "/return/order1" });
  assert.equal(open("", "/return/order1/success/case1").ready, true);
  assert.equal(open("", "/return/other").ready, false);
});
test("missing, duplicate, malformed, expired and wrong-audience grants fail closed", () => {
  for (const hash of ["", "#access_token=bad", `#access_token=${grant()}&access_token=${grant()}`, `#access_token=${grant({ exp: 1 })}`, `#access_token=${grant({ aud: "other" })}`]) {
    clearPortalAccess(); assert.equal(open(hash).ready, false);
  }
  assert.equal(open(`#access_token=${grant()}`, "/return/%INVALID").ready, false);
});
test("mobile handoff carries a temporary fragment and preserves the current origin", () => {
  open();
  const url = new URL(portalHandoffUrl("/return/mobile/rtd_test", "https://portal.test"));
  assert.equal(url.origin, "https://portal.test");
  assert.equal(url.search, "");
  assert.equal(new URLSearchParams(url.hash.slice(1)).get("access_token"), grant());
  for (const path of ["//evil.test", "/return/mobile/../../api", "/return/mobile/x?url=https://evil.test", "/return/mobile/x#bad"]) assert.throws(() => portalHandoffUrl(path, "https://portal.test"));
});
test("every portal request uses a bearer header, omits cookies, caching and referrers", async () => {
  open(); let calls = 0;
  globalThis.fetch = async (path, init) => {
    calls++;
    assert.equal(init.headers.get("Authorization"), `Bearer ${grant()}`);
    assert.equal(init.credentials, "omit"); assert.equal(init.cache, "no-store");
    assert.equal(init.referrerPolicy, "no-referrer"); assert.equal(init.redirect, "error");
    assert.ok(!path.includes("access_token"));
    return Response.json({});
  };
  for (const path of ["/api/public/returns/orders/order1", "/api/public/returns/orders/order1/drafts", "/api/public/returns/drafts/rtd_test", "/api/public/returns/orders/order1/cases", "/api/public/returns/cases/case1", "/api/return-photos"]) await portalFetch(path);
  assert.equal(calls, 6);
});
test("unsafe paths cannot exfiltrate a token and unauthenticated calls never fetch", async () => {
  globalThis.fetch = async () => { assert.fail("Network must not be used"); };
  await assert.rejects(portalFetch("/api/public/returns/orders/order1"));
  open();
  for (const path of ["https://evil.test", "//evil.test", "/api/public/returns/../../auth", "/api/public/returns/orders/..", "/api/public/returns/orders/a%2Fb", "/api/public/returns/orders/a?access_token=secret", "/api/return-photos#secret"]) await assert.rejects(portalFetch(path));
});
test("401 clears access and timeouts never automatically repeat a mutation", async () => {
  open(); globalThis.fetch = async () => Response.json({}, { status: 401 });
  await portalFetch("/api/public/returns/drafts/rtd_test");
  assert.equal(hasPortalAccess(), false);
  open(); let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("timeout"); };
  await assert.rejects(portalFetch("/api/public/returns/orders/order1/cases", { method: "POST" }));
  assert.equal(calls, 1);
});
test("tokens in query parameters are removed and cannot authenticate", () => {
  open();
  const result = open("", "/return/order1", `?draft=rtd_test&access_token=${grant()}`);
  assert.deepEqual(result, { ready: false, replacement: "/return/order1?draft=rtd_test" });
});
test("a delayed 401 cannot clear a newer grant", async () => {
  open(); let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = portalFetch("/api/public/returns/orders/order1");
  open(`#access_token=${grant({ exp: issuedAt + 800 })}`);
  finish(Response.json({}, { status: 401 })); await pending;
  assert.equal(hasPortalAccess(), true);
});
