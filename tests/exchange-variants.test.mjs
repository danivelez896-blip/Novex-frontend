import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidExchangeDestination, formatExchangeVariant } from "../lib/exchange-variants.ts";

const variant = (id, availableForSale = true) => ({
  id, availableForSale, title: "L / Negro",
  options: [{ name: "Talla", value: "L" }, { name: "Color", value: "Negro" }],
});

test("permits a distinct available Shopify variant", () => {
  assert.equal(isValidExchangeDestination(variant("gid://shopify/ProductVariant/200"), "gid://shopify/ProductVariant/100"), true);
});
test("blocks original variant, unavailable target and malformed ID", () => {
  assert.equal(isValidExchangeDestination(variant("gid://shopify/ProductVariant/100"), "gid://shopify/ProductVariant/100"), false);
  assert.equal(isValidExchangeDestination(variant("gid://shopify/ProductVariant/200", false), "gid://shopify/ProductVariant/100"), false);
  assert.equal(isValidExchangeDestination(variant("200"), "gid://shopify/ProductVariant/100"), false);
  assert.equal(isValidExchangeDestination(undefined, "gid://shopify/ProductVariant/100"), false);
});
test("shows friendly labels for the user", () => {
  assert.equal(formatExchangeVariant(variant("gid://shopify/ProductVariant/200")), "Talla: L / Color: Negro");
  assert.equal(formatExchangeVariant({ ...variant("gid://shopify/ProductVariant/200"), options: [] }), "L / Negro");
});
