import { test } from "vitest";
import { strict as assert } from "node:assert";
import { fleetFilters, fleetSelectionKey } from "./fleetSelection";

test("fleet filters scope to the run, target, path and method", () => {
  const selection = { runId: "r1", targetKey: "flo:12", path: "proxied" as const, method: "FloUdpPing" as const };
  assert.deepEqual(fleetFilters(selection), { runIds: ["r1"], targetKey: "flo:12", path: "proxied", method: "FloUdpPing" });
  assert.equal(fleetSelectionKey(selection), "r1|flo:12|proxied|FloUdpPing");
});
