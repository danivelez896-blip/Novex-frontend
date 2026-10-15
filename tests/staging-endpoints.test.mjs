import assert from "node:assert/strict";
import test from "node:test";
import { configuredEndpoint } from "../lib/staging-endpoints.ts";

test("missing and malformed endpoints fail closed", () => {
  for (const value of [undefined, "", " ", "not-a-url", "ftp://example.com", "http://example.com", "https://user:pass@example.com", "https://example.com?token=secret"]) {
    assert.equal(configuredEndpoint(value), null);
  }
});

test("explicit HTTPS and localhost endpoints are accepted", () => {
  assert.equal(configuredEndpoint("https://staging.example.com/"), "https://staging.example.com");
  assert.equal(configuredEndpoint("http://localhost:3000"), "http://localhost:3000");
});
