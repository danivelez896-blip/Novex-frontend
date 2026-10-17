import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as upload } from "../app/api/return-photos/route.ts";
import { viewReturnPhoto } from "../lib/portal-photos.ts";
const originalFetch = globalThis.fetch;
const names = ["NOVEX_API_URL", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];
const originalEnv = Object.fromEntries(names.map(key => [key, process.env[key]]));
const auth = "Bearer header.payload.signature";
const png = Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
beforeEach(() => { process.env.NOVEX_API_URL = "https://backend.invalid"; process.env.SUPABASE_URL = "https://storage.invalid"; process.env.SUPABASE_SECRET_KEY = "synthetic-key"; });
afterEach(() => { globalThis.fetch = originalFetch; for (const name of names) { if (originalEnv[name] === undefined) delete process.env[name]; else process.env[name] = originalEnv[name]; } });
function request({ authorized = true, caseId = false, file = new File([png], "photo.png", { type: "image/png" }) } = {}) {
  const form = new FormData(); form.set(caseId ? "casePublicId" : "draftToken", "rtd_test"); form.append("files", file);
  return new Request("https://portal.invalid/api/return-photos", { method: "POST", headers: authorized ? { Authorization: auth } : {}, body: form });
}
const active = () => ({ status: "ACTIVE", photoCount: 0, expiresAt: new Date(Date.now() + 60_000).toISOString() });
test("photo upload requires authorization before accessing backend or storage", async () => {
  globalThis.fetch = async () => assert.fail("No unauthenticated external call");
  assert.equal((await upload(request({ authorized: false }))).status, 401);
});
test("legacy case bypass, forged image types, strings and oversized files fail before storage", async () => {
  globalThis.fetch = async () => assert.fail("Invalid file must not trigger any network request");
  for (const options of [ { caseId: true }, { file: "not-file" }, { file: new File(["<svg/>"], "fake.png", { type: "image/png" }) },
    { file: new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }) } ]) assert.equal((await upload(request(options))).status, 400);
});
test("denied draft access prevents all storage writes and preserves backend status", async () => {
  for (const status of [401, 403, 404]) {
    let calls = 0;
    globalThis.fetch = async (url, init) => { calls++; assert.equal(init.headers.get("Authorization"), auth); assert.ok(url.startsWith("https://backend.invalid/")); return Response.json({}, { status }); };
    assert.equal((await upload(request())).status, status); assert.equal(calls, 1);
  }
});
test("consumed, expired, over-capacity or malformed drafts cannot receive photos", async () => {
  for (const change of [{ status: "CONSUMED" }, { consumedAt: "2026-01-01" }, { expiresAt: "2020-01-01" }, { expiresAt: "invalid" }, { photoCount: 5 }, { photoCount: "0" }]) {
    let calls = 0;
    globalThis.fetch = async (url) => { calls++; assert.ok(url.startsWith("https://backend.invalid/")); return Response.json({ ...active(), ...change }); };
    assert.equal((await upload(request())).status, 409); assert.equal(calls, 1);
  }
});
test("authorized upload uses a server-generated draft path and forwards the bearer for registration", async () => {
  const draft = active(); const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(url);
    if (url.startsWith("https://storage.invalid/")) {
      assert.equal(init.headers.apikey, "synthetic-key"); assert.equal(init.headers.Authorization, undefined);
      assert.equal(init.redirect, "error"); assert.match(url, /return-photos\/drafts\/rtd_test\/[a-f0-9-]{36}\.png$/);
      return Response.json({});
    }
    assert.equal(init.headers.get("Authorization"), auth);
    if (url.endsWith("/photos")) {
      const body = JSON.parse(init.body); assert.match(body.fileUrl, /^drafts\/rtd_test\/[a-f0-9-]{36}\.png$/); assert.equal(body.mimeType, "image/png"); draft.photoCount++; return Response.json({ photoCount: 1 });
    }
    return Response.json(draft);
  };
  const response = await upload(request()); assert.equal(response.status, 200); assert.equal((await response.json()).photoCount, 1); assert.equal(calls.length, 4);
});
test("an unknown storage result is sanitized and never automatically retried", async () => {
  let writes = 0;
  globalThis.fetch = async (url) => {
    if (url.startsWith("https://storage.invalid/")) { writes++; throw new Error("private secret"); }
    return Response.json(active());
  };
  const response = await upload(request()); assert.equal(response.status, 503); assert.equal(writes, 1); assert.ok(!(await response.text()).includes("private secret"));
});
const imagePath = "drafts/rtd_test/00000000-0000-4000-8000-000000000001.png";
const viewRequest = () => new Request(`https://portal.invalid/api/return-photos/view?caseId=1&path=${imagePath}`);
test("photo viewing requires case membership and exact attachment ownership", async () => {
  globalThis.fetch = async () => assert.fail("Denied photo must never reach storage");
  for (const status of [401,403,404]) assert.equal((await viewReturnPhoto(viewRequest(), async () => Response.json({}, { status }))).status, status);
  assert.equal((await viewReturnPhoto(viewRequest(), async () => Response.json({ attachments: [{ fileType: "IMAGE", fileUrl: "someone-else" }] }))).status, 404);
  assert.equal((await viewReturnPhoto(new Request("https://portal.invalid/api/return-photos/view?path=../secret"), async () => assert.fail("No lookup for invalid path"))).status, 400);
});
test("permitted photo viewing disables caches and MIME sniffing", async () => {
  globalThis.fetch = async (_url, init) => { assert.equal(init.redirect, "error"); return new Response(png, { headers: { "Content-Type": "image/png" } }); };
  const response = await viewReturnPhoto(viewRequest(), async () => Response.json({ attachments: [{ fileType: "IMAGE", fileUrl: imagePath }] }));
  assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store"); assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});
