import { test, expect, type Page } from "@playwright/test";

function token(overrides = {}) {
  const claims = { aud: "novex:return-portal:v1", orderPublicId: "order1", exp: Math.floor(Date.now()/1000) + 600, ...overrides };
  return [Buffer.from(JSON.stringify({ alg: "HS256", typ: "NOVEX-PORTAL" })).toString("base64url"), Buffer.from(JSON.stringify(claims)).toString("base64url"), "synthetic"].join(".");
}
async function fixture(page: Page, options: { requirePhotos?: boolean; unauthorized?: boolean; unavailable?: boolean; restoreFailure?: boolean; lostCase?: boolean } = {}) {
  const grant = token();
  const calls: { path: string; method: string; authorization?: string; body: unknown }[] = [];
  let photoCount = 0, consumed = false;
  const payload = { "10": { selected: true, quantity: 1, reason: "No era lo esperado", comment: "conservar" } };
  await page.context().route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:3100") return route.abort("blockedbyclient");
    if (!url.pathname.startsWith("/api/")) return route.continue();
    calls.push({ path: url.pathname, method: request.method(), authorization: request.headers().authorization, body: request.headers()["content-type"]?.includes("application/json") ? request.postDataJSON() : null });
    if (options.unauthorized) return route.fulfill({ status: 401, json: { message: "Acceso caducado" } });
    if (url.pathname === "/api/return-photos") { photoCount++; return route.fulfill({ json: { success: true, photoCount } }); }
    if (url.pathname.endsWith("/cases") && request.method() === "POST") {
      consumed = true;
      if (options.lostCase) return route.abort("failed");
      return route.fulfill({ json: { publicId: "case1" } });
    }
    if (url.pathname.includes("/cases/")) return route.fulfill({ json: { publicId: "case1", status: "PENDING_REVIEW", requestedAt: new Date().toISOString(), closedAt: null, store: { name: "Tienda de prueba" }, order: { publicId: "order1", orderNumber: "#TEST" }, events: [], shipment: null } });
    if (url.pathname.includes("/drafts")) {
      if (options.restoreFailure && request.method() === "GET") return route.fulfill({ status: 503, json: { message: "No disponible" } });
      return route.fulfill({ json: { token: "rtd_test", orderPublicId: "order1", payload, photoCount, expiresAt: new Date(Date.now() + 3600_000).toISOString(), status: consumed ? "CONSUMED" : "ACTIVE", casePublicId: consumed ? "case1" : null } });
    }
    return route.fulfill({ json: { order: { publicId: "order1", orderNumber: "#TEST", totalAmount: "20", currency: "EUR", orderedAt: "2026-10-01", customer: { firstName: "Cliente", lastName: "Prueba" }, store: { id: 2, name: "Tienda de prueba", platform: "SHOPIFY" }, items: [{ id: 10, productName: "Camiseta de prueba", variantName: "M", sku: "TEST", quantity: 2, returnableQuantity: options.unavailable ? 0 : 2, returnabilityReason: null, unitPrice: "10.00", currency: "EUR", isReturnable: true }] }, rule: { returnDays: 30, allowReturns: true, requirePhotos: !!options.requirePhotos, rejectionMessage: null, customerConditions: ["Conserva la etiqueta"], returnDeadline: "2026-11-01", withinReturnPeriod: true } } });
  });
  const open = (path = "/return/order1") => page.goto(`${path}#access_token=${grant}`);
  return { grant, calls, open };
}
async function selectItem(page: Page) {
  await page.getByRole("checkbox").check();
  await page.locator("select").nth(1).selectOption("No era lo esperado");
}
test("uncredentialed and expired links show a relink screen without API calls", async ({ page }) => {
  const f = await fixture(page);
  await page.goto("/return/order1");
  await expect(page.getByRole("heading", { name: "Vuelve a abrir tu devolución" })).toBeVisible();
  await page.goto(`/return/order1#access_token=${token({ exp: 1 })}`);
  await expect(page.getByRole("heading", { name: "Vuelve a abrir tu devolución" })).toBeVisible();
  expect(f.calls).toHaveLength(0);
});
test("authorized portal removes fragment, keeps credentials out of storage and fits the viewport", async ({ page }, info) => {
  const f = await fixture(page); await f.open();
  await expect(page.getByRole("heading", { name: "Solicitar una devolución" })).toBeVisible();
  await expect(page).toHaveURL(/\/return\/order1$/);
  expect(f.calls.every(call => call.authorization === `Bearer ${f.grant}`)).toBeTruthy();
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: info.outputPath("portal.png"), fullPage: true });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Vuelve a abrir tu devolución" })).toBeVisible();
});
test("401 and an order-mismatched grant hide customer data", async ({ page }) => {
  const f = await fixture(page, { unauthorized: true }); await f.open();
  await expect(page.getByRole("heading", { name: "Vuelve a abrir tu devolución" })).toBeVisible();
  await expect(page.getByText("Camiseta de prueba")).toHaveCount(0);
  const count = f.calls.length;
  await f.open("/return/other");
  await expect(page.getByRole("heading", { name: "Vuelve a abrir tu devolución" })).toBeVisible();
  expect(f.calls).toHaveLength(count);
});
test("a legitimate return always consumes a draft and keeps authorization on the success page", async ({ page }) => {
  const f = await fixture(page); await f.open(); await selectItem(page);
  await page.getByRole("button", { name: "Enviar devolución" }).click();
  await expect(page).toHaveURL(/\/success\/case1$/);
  await expect(page.getByRole("heading", { name: "Solicitud recibida" })).toBeVisible();
  const submitted = f.calls.find(call => call.path.endsWith("/cases") && call.method === "POST");
  expect(submitted?.body).toMatchObject({ draftToken: "rtd_test", items: [{ orderItemId: 10, quantity: 1, reason: "No era lo esperado" }] });
  expect(f.calls.every(call => call.authorization === `Bearer ${f.grant}`)).toBeTruthy();
});
test("unavailable quantities are disabled", async ({ page }) => {
  const f = await fixture(page, { unavailable: true }); await f.open();
  await expect(page.getByRole("checkbox")).toBeDisabled();
});
test("failed draft restoration never overwrites its saved payload", async ({ page }) => {
  const f = await fixture(page, { restoreFailure: true }); await f.open("/return/order1?draft=rtd_test");
  await expect(page.getByText("El enlace compartido ha caducado o ya no está disponible.")).toBeVisible();
  await expect(page.getByRole("checkbox")).toBeDisabled();
  await page.waitForTimeout(700);
  expect(f.calls.some(call => call.method === "PATCH")).toBeFalsy();
});
test("a lost case response is recovered by polling the same draft without repeating the POST", async ({ page }) => {
  const f = await fixture(page, { lostCase: true }); await f.open(); await selectItem(page);
  await page.getByRole("button", { name: "Enviar devolución" }).click();
  await expect(page).toHaveURL(/\/success\/case1$/);
  expect(f.calls.filter(call => call.path.endsWith("/cases") && call.method === "POST")).toHaveLength(1);
});
test("mobile draft lookup and continuation preserve the in-memory grant", async ({ page }) => {
  const f = await fixture(page); await f.open("/return/mobile/rtd_test");
  await expect(page.getByRole("heading", { name: "Añadir fotos" })).toBeVisible();
  await page.getByRole("link", { name: "Continuar la devolución en este móvil" }).click();
  await expect(page.getByRole("heading", { name: "Solicitar una devolución" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toBeChecked();
  expect(f.calls.every(call => call.authorization === `Bearer ${f.grant}`)).toBeTruthy();
});
test("required photographs are authorized and uploaded to the draft before case creation", async ({ page }) => {
  const f = await fixture(page, { requirePhotos: true }); await f.open(); await selectItem(page);
  await page.getByRole("button", { name: "Enviar devolución" }).click();
  await expect(page.getByText("Esta tienda exige al menos una foto para solicitar la devolución.")).toBeVisible();
  expect(f.calls.some(call => call.path.endsWith("/cases") && call.method === "POST")).toBeFalsy();
  await page.locator('input[type="file"]').last().setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]) });
  await page.getByRole("button", { name: "Enviar devolución" }).click();
  await expect(page).toHaveURL(/\/success\/case1$/);
  const photoIndex = f.calls.findIndex(call => call.path === "/api/return-photos");
  const caseIndex = f.calls.findIndex(call => call.path.endsWith("/cases") && call.method === "POST");
  expect(photoIndex).toBeGreaterThan(-1); expect(photoIndex).toBeLessThan(caseIndex);
  expect(f.calls[photoIndex].authorization).toBe(`Bearer ${f.grant}`);
});
test("QR handoff copies a temporary same-origin link with a fragment grant", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => { Object.defineProperty(navigator, "clipboard", { value: { writeText: (value: string) => { Object.defineProperty(window, "copiedLink", { value, configurable: true }); return Promise.resolve(); } } }); });
  const f = await fixture(page); await f.open();
  await selectItem(page);
  await page.getByRole("button", { name: "Subir fotos desde el móvil" }).click();
  await expect(page.getByAltText("QR para continuar la devolución en el móvil")).toBeVisible();
  await page.getByRole("button", { name: "Copiar enlace" }).click();
  const copied = await page.evaluate(() => Reflect.get(window, "copiedLink") as string);
  const url = new URL(copied); expect(url.origin).toBe("http://127.0.0.1:3100"); expect(url.pathname).toBe("/return/mobile/rtd_test");
  expect(url.search).toBe(""); expect(new URLSearchParams(url.hash.slice(1)).get("access_token")).toBe(f.grant);
});
