import { test } from "vitest";
import { strict as assert } from "node:assert";
import { asnText, audienceSummary, counterTiles, DASH, formatDuration, formatMs, formatPercent, formatShare, geoText, progressText, runStatus, targetsSummary, textOrDash, utcDateRangeToIso } from "./format";
import type { RunDto, RunTargets } from "@/store/admin/networkDiagnostics/types";

const noTargets: RunTargets = { floNodeIds: [], allFloNodes: false, coreServers: [], baselines: [], customTargets: [], includeDefaultGateway: false };

function run(overrides: Partial<Pick<RunDto, "cancelledAt" | "windowEnd" | "counters">>): Pick<RunDto, "cancelledAt" | "windowEnd" | "counters"> {
  return { cancelledAt: null, windowEnd: null, counters: { assigned: 2, delivered: 2, submitted: 1, expired: 0 }, ...overrides };
}

test("numbers render with units and a dash when missing", () => {
  assert.equal(formatMs(12.34), "12.3 ms");
  assert.equal(formatMs(null), DASH);
  assert.equal(formatMs(Number.NaN), DASH);
  assert.equal(formatPercent(1.666), "1.7%");
  assert.equal(formatPercent(undefined), DASH);
  assert.equal(formatShare(0.05), "5.0%", "a share is 0..1, a percent is already ×100");
  assert.equal(formatShare(null), DASH);
});

test("durations read naturally from seconds to days", () => {
  assert.equal(formatDuration(45), "45 s");
  assert.equal(formatDuration(75), "1 min 15 s");
  assert.equal(formatDuration(120), "2 min");
  assert.equal(formatDuration(3720), "1 h 2 min");
  assert.equal(formatDuration(3600), "1 h");
  assert.equal(formatDuration(90000), "1 d 1 h");
  assert.equal(formatDuration(-5), "0 s");
});

test("audience summary names one player and counts the rest", () => {
  assert.equal(audienceSummary({ kind: "Users", battleTags: ["Name#1234"] }), "Name#1234");
  assert.equal(audienceSummary({ kind: "Users", battleTags: ["A#1234", "B#1234"] }), "2 players");
  assert.equal(audienceSummary({ kind: "SampleCount", count: 50 }), "Sample of 50 online");
  assert.equal(audienceSummary({ kind: "SamplePercent", percent: 2.5 }), "2.5% of online");
  assert.equal(audienceSummary({ kind: "All" }), "All online");
});

test("targets summary counts each kind and says all nodes", () => {
  assert.equal(targetsSummary({ ...noTargets, floNodeIds: [1, 2], baselines: ["cloudflare"], includeDefaultGateway: true }), "2 nodes · 1 baseline · gateway");
  assert.equal(targetsSummary({ ...noTargets, allFloNodes: true, floNodeIds: [], customTargets: [{ ip: "10.0.0.5", tcpPort: 443 }], coreServers: ["bigboi"] }), "all nodes · 1 core server · 1 custom target");
  assert.equal(targetsSummary(noTargets), DASH);
});

test("progress and counter tiles carry all four counters", () => {
  const counters = { assigned: 10, delivered: 8, submitted: 6, expired: 1 };
  assert.equal(progressText(counters), "8/10 delivered · 6 submitted · 1 expired");
  assert.deepEqual(counterTiles(counters).map((t) => [t.label, t.value]), [["Assigned", 10], ["Delivered", 8], ["Submitted", 6], ["Expired", 1]]);
});

test("run status: cancelled wins, an open fleet window is running, settled runs are complete", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  assert.equal(runStatus(run({ cancelledAt: "2026-10-12T11:00:00Z" }), now), "Cancelled");
  assert.equal(runStatus(run({ windowEnd: "2026-10-12T12:10:00Z", counters: { assigned: 0, delivered: 0, submitted: 0, expired: 0 } }), now), "Running");
  assert.equal(runStatus(run({ windowEnd: "2026-10-12T11:30:00Z", counters: { assigned: 0, delivered: 0, submitted: 0, expired: 0 } }), now), "No participants");
  assert.equal(runStatus(run({}), now), "Running", "one of two still pending");
  assert.equal(runStatus(run({ counters: { assigned: 2, delivered: 2, submitted: 1, expired: 1 } }), now), "Complete");
});

test("UTC date filters: from is the day start, to includes its whole day, bad input is dropped", () => {
  assert.deepEqual(utcDateRangeToIso("2026-10-01", "2026-10-12"), { from: "2026-10-01T00:00:00.000Z", to: "2026-10-13T00:00:00.000Z" });
  assert.deepEqual(utcDateRangeToIso("", "2026-02-30"), { from: undefined, to: undefined });
});

test("geo and ASN text tolerate missing parts", () => {
  assert.equal(geoText({ city: "Berlin", country: "DE" }), "Berlin, DE");
  assert.equal(geoText({ city: null, country: "DE" }), "DE");
  assert.equal(geoText(null), DASH);
  assert.equal(asnText(3320, "Deutsche Telekom AG"), "AS3320 Deutsche Telekom AG");
  assert.equal(asnText(3320, null), "AS3320");
  assert.equal(asnText(null), DASH);
});

test("optional text cells render a dash when the server sent nothing", () => {
  assert.equal(textOrDash("203.0.113.7"), "203.0.113.7");
  assert.equal(textOrDash(null), DASH);
  assert.equal(textOrDash(undefined), DASH);
  assert.equal(textOrDash(""), DASH);
});
