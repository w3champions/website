import { test } from "vitest";
import { strict as assert } from "node:assert";
import type { AggregateResponseDto, AggregateRowDto, ObservationDto, RunDto, TargetsDto } from "@/store/admin/networkDiagnostics/types";
import { aggregateBars, aggregateKeyLabel, aggregateTableRows, bucketLegend, chartNotice, fleetEmptyState, fleetLoadPlan, floNodesMissing, lossBucket, mapNotice, mapPoints, observationBucket, p50Bucket, pathItems, runTargetItems } from "./fleet";

const catalogue: TargetsDto = {
  floNodes: [{ id: 12, name: "US East 4", location: "Ashburn", countryId: "US", isDisabled: false }, { id: 14, name: "EU 1", location: "Frankfurt", countryId: "DE", isDisabled: false }],
  coreServers: [{ key: "bigboi", label: "bigboi", ip: "203.0.113.10", tcpPort: 443 }],
  baselines: [{ key: "cloudflare", label: "Cloudflare 1.1.1.1", region: "global", ip: "1.1.1.1", tcpPort: 443 }],
};

const runTargets = (overrides: Partial<RunDto["targets"]>): Pick<RunDto, "targets"> => ({
  targets: { floNodeIds: [], allFloNodes: false, coreServers: [], baselines: [], customTargets: [], includeDefaultGateway: false, ...overrides },
});

function row(key: AggregateRowDto["key"], overrides: Partial<AggregateRowDto> = {}): AggregateRowDto {
  return { key, count: 10, p50MsMedian: 22.1, p50MsP90: 41, lossPctMedian: 0, shareLossOver1Pct: 0.05, shareUnreachable: 0, asnOrg: null, lat: null, lon: null, ...overrides };
}

function observation(overrides: Partial<ObservationDto>): ObservationDto {
  return {
    measurementId: "m",
    runId: "r",
    battleTag: "Name#1234",
    submittedAt: "2026-10-12T10:00:00Z",
    clientIp: "203.0.113.7",
    country: "DE",
    city: "Berlin",
    lat: 52.5,
    lon: 13.4,
    asn: 3320,
    asnOrg: "DTAG",
    os: "windows",
    primaryAdapterType: "ethernet",
    vpnSuspected: false,
    targetKey: "flo:12",
    targetLabel: "US East 4",
    targetIp: "1.2.3.4",
    path: "direct",
    routeLabel: null,
    method: "TcpPing",
    outcome: "ok",
    reason: null,
    sent: 60,
    received: 60,
    lossPct: 0,
    minMs: 20,
    avgMs: 22,
    maxMs: 30,
    stddevMs: 1,
    p50Ms: 22,
    p90Ms: 25,
    p95Ms: 26,
    p99Ms: 29,
    jitterMs: 0.5,
    hopCount: 0,
    lastHopIp: null,
    lastHopAsn: null,
    ...overrides,
  };
}

test("target items follow the run's selection with C4 keys and catalogue names", () => {
  const items = runTargetItems(runTargets({ floNodeIds: [12, 99], coreServers: ["bigboi"], baselines: ["cloudflare"], customTargets: [{ ip: "10.0.0.5", tcpPort: 443 }], includeDefaultGateway: true }), catalogue);
  assert.deepEqual(items, [
    { title: "US East 4", value: "flo:12" },
    { title: "Node 99", value: "flo:99" },
    { title: "bigboi", value: "core:bigboi" },
    { title: "Cloudflare 1.1.1.1", value: "baseline:cloudflare" },
    { title: "10.0.0.5:443", value: "custom:10.0.0.5:443" },
    { title: "Default gateway", value: "gateway" },
  ]);
});

test("all flo nodes expands to the catalogue; without a catalogue keys stay usable", () => {
  assert.deepEqual(runTargetItems(runTargets({ allFloNodes: true }), catalogue).map((i) => i.value), ["flo:12", "flo:14"]);
  assert.deepEqual(runTargetItems(runTargets({ baselines: ["cloudflare"] }), null), [{ title: "cloudflare", value: "baseline:cloudflare" }]);
});

test("disabled flo nodes are labelled in the target list", () => {
  const withDisabled: TargetsDto = { ...catalogue, floNodes: [...catalogue.floNodes, { id: 15, name: "Old", location: "Nowhere", countryId: "XX", isDisabled: true }] };
  assert.deepEqual(runTargetItems(runTargets({ allFloNodes: true }), withDisabled).map((i) => i.title), ["US East 4", "EU 1", "Old (disabled)"]);
  assert.deepEqual(runTargetItems(runTargets({ floNodeIds: [15] }), withDisabled), [{ title: "Old (disabled)", value: "flo:15" }]);
});

test("only flo nodes have a proxied path", () => {
  assert.deepEqual(pathItems("flo:12"), ["direct", "proxied"]);
  assert.deepEqual(pathItems("baseline:cloudflare"), ["direct"]);
  assert.deepEqual(pathItems("gateway"), ["direct"]);
});

test("aggregate keys read as labels; missing values are Unknown", () => {
  assert.equal(aggregateKeyLabel(row({ asn: 3320 }, { asnOrg: "Deutsche Telekom AG" }), ["asn"]), "AS3320 Deutsche Telekom AG");
  assert.equal(aggregateKeyLabel(row({ country: null }), ["country"]), "Unknown");
  assert.equal(aggregateKeyLabel(row({ city: "Berlin", vpn: true }), ["city", "vpn"]), "Berlin · VPN");
  assert.equal(aggregateKeyLabel(row({ vpn: false }), ["vpn"]), "No VPN");
});

test("aggregate table formats ms, percent and shares", () => {
  const response: AggregateResponseDto = { groupBy: ["country"], rows: [row({ country: "DE" }, { lossPctMedian: 1.24, shareUnreachable: 0.5, p50MsP90: null })] };
  assert.deepEqual(aggregateTableRows(response), [{ label: "DE", count: 10, p50Median: "22.1 ms", p50P90: "—", lossMedian: "1.2%", lossOver1: "5.0%", unreachable: "50.0%" }]);
});

test("aggregate bars keep the largest groups and show counts in labels", () => {
  const response: AggregateResponseDto = { groupBy: ["country"], rows: [row({ country: "DE" }, { count: 40 }), row({ country: "FR" }, { count: 30, p50MsMedian: null }), row({ country: "PL" }, { count: 1 })] };
  assert.deepEqual(aggregateBars(response, 2), { labels: ["DE (40)", "FR (30)"], p50Median: [22.1, null], p50P90: [41, 41] });
});

test("p50 buckets: < 80 good, < 150 fair, otherwise bad; null unknown", () => {
  assert.equal(p50Bucket(79.9), "good");
  assert.equal(p50Bucket(80), "fair");
  assert.equal(p50Bucket(149.9), "fair");
  assert.equal(p50Bucket(150), "bad");
  assert.equal(p50Bucket(null), "unknown");
});

test("loss buckets: ≤ 0.5 % good, ≤ 2 % fair, more is bad", () => {
  assert.equal(lossBucket(0), "good");
  assert.equal(lossBucket(0.5), "good");
  assert.equal(lossBucket(0.6), "fair");
  assert.equal(lossBucket(2), "fair");
  assert.equal(lossBucket(2.1), "bad");
  assert.equal(lossBucket(null), "unknown");
});

test("unreachable is bad on either metric; unsupported, timeout and error are unknown", () => {
  assert.equal(observationBucket(observation({ outcome: "unreachable", p50Ms: null, lossPct: 100 }), "p50"), "bad");
  assert.equal(observationBucket(observation({ outcome: "unsupported", p50Ms: null }), "loss"), "unknown");
  assert.equal(observationBucket(observation({ p50Ms: 200 }), "p50"), "bad");
  assert.equal(observationBucket(observation({ p50Ms: 200, lossPct: 0 }), "loss"), "good");
});

test("map points skip measurements without coordinates and keep labels as plain text", () => {
  const points = mapPoints([observation({ city: "<b>Berlin</b>" }), observation({ lat: null })], "p50");
  assert.equal(points.length, 1);
  const { label, ...position } = points[0];
  assert.deepEqual(position, { lat: 52.5, lon: 13.4, bucket: "good" });
  assert.equal(label, "Name#1234 · <b>Berlin</b>, DE · AS3320 DTAG · p50 22.0 ms · loss 0.0% · ok");
});

test("legend text names the thresholds", () => {
  assert.deepEqual(bucketLegend("p50"), { good: "p50 < 80 ms", fair: "80–150 ms", bad: "≥ 150 ms or unreachable", unknown: "no data" });
  assert.deepEqual(bucketLegend("loss"), { good: "loss ≤ 0.5%", fair: "≤ 2%", bad: "> 2% or unreachable", unknown: "no data" });
});

test("the map notice counts drawn and unlocated measurements and never says first 0", () => {
  assert.equal(mapNotice({ shown: 5, withoutLocation: 0, truncated: false }), null);
  assert.match(mapNotice({ shown: 19990, withoutLocation: 10, truncated: true }) ?? "", /Showing the first 19,990 measurements.*more may exist.*10 loaded measurements have no location/);
  const none = mapNotice({ shown: 0, withoutLocation: 0, truncated: true }) ?? "";
  assert.doesNotMatch(none, /first 0/);
  assert.match(none, /cut off/);
  assert.match(mapNotice({ shown: 3, withoutLocation: 2, truncated: false }) ?? "", /^2 loaded measurements have no location/);
  assert.equal(mapNotice({ shown: 3, withoutLocation: 1, truncated: false }), "1 loaded measurement has no location and is not drawn.");
});

test("the chart notice appears only when groups were cut", () => {
  assert.equal(chartNotice(20), null);
  assert.equal(chartNotice(25), "The chart shows the 20 largest of 25 groups; the table lists all.");
});

test("the fleet empty state tells loading, unavailable and empty targets apart", () => {
  const all = { targets: { allFloNodes: true } } as RunDto;
  const some = { targets: { allFloNodes: false } } as RunDto;
  assert.equal(fleetEmptyState(all, null, true, 0), "targets-loading");
  assert.equal(fleetEmptyState(all, null, false, 0), "targets-unavailable");
  assert.equal(fleetEmptyState(some, null, false, 0), "no-targets");
  assert.equal(fleetEmptyState(some, null, false, 2), null);
  assert.equal(fleetEmptyState(all, {} as TargetsDto, false, 3), null);
  assert.equal(fleetEmptyState(all, {} as TargetsDto, false, 0), "no-targets");
  // Selectable non-flo targets keep the view usable without the catalogue.
  assert.equal(fleetEmptyState(all, null, false, 1), null);
  assert.equal(floNodesMissing(all, null), true);
  assert.equal(floNodesMissing(all, {} as TargetsDto), false);
  assert.equal(floNodesMissing(some, null), false);
});

test("a group-by change loads only the aggregate; a selection or run change loads both", () => {
  const run = {};
  const base = { selectionKey: "r1|flo:12|direct|TcpPing", groupBy: "country" as const, run };
  assert.deepEqual(fleetLoadPlan(base, undefined), { observations: true, aggregate: true });
  assert.deepEqual(fleetLoadPlan({ ...base, groupBy: "asn" }, base), { observations: false, aggregate: true });
  assert.deepEqual(fleetLoadPlan({ ...base, selectionKey: "r1|flo:14|direct|TcpPing" }, base), { observations: true, aggregate: true });
  assert.deepEqual(fleetLoadPlan({ ...base, run: {} }, base), { observations: true, aggregate: true });
});
