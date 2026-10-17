import assert from "node:assert/strict";
import test from "node:test";

import { areRealEconomicActionsEnabled } from "../lib/economic-actions.ts";

test("real economic actions are disabled by default", () => {
  assert.equal(areRealEconomicActionsEnabled(undefined), false);
  assert.equal(areRealEconomicActionsEnabled("false"), false);
  assert.equal(areRealEconomicActionsEnabled("TRUE"), false);
});

test("real economic actions require explicit true", () => {
  assert.equal(areRealEconomicActionsEnabled("true"), true);
});
