import { test } from "vitest";
import { strict as assert } from "node:assert";
import type { FloSnapshotRow, HopDto, MeasurementDetailDto, ProbeDto, StatsDto, TargetResultDto } from "@/store/admin/networkDiagnostics/types";
import { adapterLine, antivirusLine, cpuLine, endpointsLine, finalHop, formatBitRate, hasProbeStats, hopEnrichment, hopRows, measurementFacts, memoryLine, methodLabel, MTR_LOSS_NOTE, mtrNotes, NO_RAW_SAMPLES_NOTICE, orderedPaths, osText, outcomeColor, outcomeText, pathLabel, probeStatsLine, RAW_EXPIRED_NOTICE, rawSamplesNotice, rttSeries, snapshotRows, targetTitle, TCP_MTR_LAST_HOP_NOTE, vpnLine, wifiLine } from "./measurementView";

const stats = (overrides: Partial<StatsDto> = {}): StatsDto => ({
  sent: 60,
  received: 59,
  lossPct: 1.67,
  lastMs: 12.1,
  minMs: 11,
  avgMs: 12.3,
  maxMs: 40.2,
  stddevMs: 1.1,
  p50Ms: 12,
  p90Ms: 13.5,
  p95Ms: 14,
  p99Ms: 30,
  jitterMs: 0.6,
  ...overrides,
});
const noReplies = stats({ sent: 0, received: 0, lossPct: 100, lastMs: null, minMs: null, avgMs: null, maxMs: null, stddevMs: null, p50Ms: null, p90Ms: null, p95Ms: null, p99Ms: null, jitterMs: null });

function nullHeavy(): MeasurementDetailDto {
  return {
    measurementId: "m-1",
    runId: "r-1",
    battleTag: "Name#1234",
    submittedAt: "2026-10-12T10:00:00Z",
    clientIp: null,
    clientGeo: null,
    os: null,
    primaryAdapterType: null,
    vpnSuspected: null,
    targetCount: 1,
    restarts: 0,
    osInfo: null,
    launcherVersion: null,
    attemptStartedAt: "2026-10-12T09:57:00Z",
    windowStartedAt: "2026-10-12T09:58:00Z",
    windowEndedAt: "2026-10-12T09:59:00Z",
    pacing: null,
    system: null,
    floSnapshot: [],
    defaultGateway: null,
    ipInfo: {},
    rawExpired: true,
    targets: [{
      targetKey: "gateway",
      label: "Default gateway",
      paths: [{ path: "direct", routeLabel: null, endpoints: { icmp: null, tcp: null, udp: null }, probes: [{ method: "IcmpTraceroute", outcome: "unreachable", reason: null, stats: null, hops: [] }] }],
    }],
  };
}

test("null-heavy measurement: every header fact is text, never null/undefined/NaN", () => {
  const facts = measurementFacts(nullHeavy());
  for (const fact of facts) assert.ok(!/undefined|null|NaN/.test(fact.value), `${fact.label}: ${fact.value}`);
  const byLabel = new Map(facts.map((f) => [f.label, f.value]));
  assert.equal(byLabel.get("Location"), "—");
  assert.equal(byLabel.get("OS"), "—", "no OS at all renders the dash");
  assert.equal(byLabel.get("Uptime"), "—");
  assert.equal(byLabel.get("Window"), "2026-10-12 09:58 UTC – 2026-10-12 09:59 UTC");
  assert.equal(byLabel.get("Antivirus"), "—");
});

test("OS text: name and version, the family alone, or a dash", () => {
  assert.equal(osText({ os: "windows", osInfo: { family: "windows", name: null, version: null } }), "windows", "falls back to the family without name/version");
  assert.equal(osText({ os: null, osInfo: { family: "macos" } }), "macos");
  assert.equal(osText({ os: "windows", osInfo: undefined }), "windows");
  assert.equal(osText({ os: null, osInfo: null }), "—");
  assert.equal(osText({ os: null }), "—");
});

test("full header facts read naturally", () => {
  const detail: MeasurementDetailDto = {
    ...nullHeavy(),
    clientIp: "203.0.113.7",
    osInfo: { family: "windows", name: "Windows 11 Pro", version: "10.0.26200" },
    clientGeo: { country: "DE", city: "Berlin", lat: 52.5, lon: 13.4, asn: 3320, asnOrg: "Deutsche Telekom AG", geoDbBuild: "2026-10-07" },
    pacing: { mtrRoundMs: 6000, pingIntervalMs: 1000, streams: 330 },
    system: {
      cpu: { model: "Ryzen 7", cores: 8, usagePct: 12.5 },
      memory: { totalMb: 32768, usedMb: 14000 },
      uptimeS: 90000,
      clockSkewMs: 12,
      launcherProxyConfigured: false,
      adapters: [],
      wifi: null,
      vpn: { suspected: true, evidence: ["utun3 holds default route"] },
      antivirus: { thirdParty: ["Kaspersky"], reason: null },
    },
  };
  const byLabel = new Map(measurementFacts(detail).map((f) => [f.label, f.value]));
  assert.equal(byLabel.get("Location"), "Berlin, DE");
  assert.equal(byLabel.get("Network"), "AS3320 Deutsche Telekom AG");
  assert.equal(byLabel.get("OS"), "Windows 11 Pro 10.0.26200");
  assert.equal(byLabel.get("CPU"), "Ryzen 7 · 8 cores · 12.5% busy");
  assert.equal(byLabel.get("Memory"), "14000 / 32768 MB");
  assert.equal(byLabel.get("Uptime"), "1 d 1 h");
  assert.equal(byLabel.get("VPN"), "suspected: utun3 holds default route");
  assert.equal(byLabel.get("Antivirus"), "Kaspersky");
  assert.equal(byLabel.get("Pacing"), "MTR round 6000 ms · ping every 1000 ms · 330 streams");
});

test("probe stats: traceroute-only probes show a dash, no replies show dashes per value", () => {
  const traceOnly: ProbeDto = { method: "IcmpTraceroute", outcome: "ok", reason: null, stats: null, hops: [] };
  assert.equal(probeStatsLine(traceOnly), "—");
  const silent: ProbeDto = { method: "TcpPing", outcome: "unreachable", reason: null, stats: noReplies, hops: null };
  assert.equal(probeStatsLine(silent), "p50 — · p90 — · p99 — · max — · loss 100.0% · jitter — · 0/0 answered");
  const good: ProbeDto = { method: "TcpPing", outcome: "ok", reason: null, stats: stats(), hops: null };
  assert.equal(probeStatsLine(good), "p50 12.0 ms · p90 13.5 ms · p99 30.0 ms · max 40.2 ms · loss 1.7% · jitter 0.6 ms · 59/60 answered");
});

test("hops map to MtrHopTable rows and pick up GeoIP facts by IP", () => {
  const hops: HopDto[] = [{ ttl: 1, ip: "192.168.1.1", stats: stats({ avgMs: 1.5 }) }, { ttl: 2, ip: null, stats: noReplies }, { ttl: 3, ip: "198.51.100.1", stats: stats() }];
  assert.deepEqual(hopRows(hops)[0], { hopNumber: 1, host: "192.168.1.1", avgRttMs: 1.5, minRttMs: 11, maxRttMs: 40.2, stddevMs: 1.1, lossPercent: 1.67 });
  assert.equal(hopRows(hops)[1].host, null);
  const info = hopEnrichment(hops, { "198.51.100.1": { asn: 3320, asnOrg: "DTAG", country: "DE", city: null, lat: null, lon: null, geoDbBuild: null } });
  assert.deepEqual(info, [null, null, { asn: 3320, asnOrg: "DTAG", city: null, country: "DE" }]);
});

const target: TargetResultDto = {
  targetKey: "flo:12",
  label: "US East 4",
  paths: [
    { path: "proxied", routeLabel: "US East 4 -> US East 3", endpoints: { icmp: "5.6.7.8", tcp: "5.6.7.8:3554", udp: "5.6.7.8:3552" }, probes: [{ method: "FloUdpPing", outcome: "ok", reason: null, stats: stats(), hops: null, samples: [[0, 20.5], [1000, null]] }] },
    {
      path: "direct",
      routeLabel: null,
      endpoints: { icmp: "1.2.3.4", tcp: "1.2.3.4:3554", udp: null },
      probes: [
        // Hops arrive out of TTL order on purpose: the final hop is the highest TTL, not the last element.
        {
          method: "IcmpMtr",
          outcome: "ok",
          reason: null,
          stats: stats(),
          hops: [
            { ttl: 2, ip: "1.2.3.4", stats: stats(), samples: [[0, 14.8], [6000, null]] },
            { ttl: 1, ip: "192.168.1.1", stats: stats(), samples: [[0, 1.1], [6000, 1.2]] },
          ],
        },
        { method: "TcpPing", outcome: "ok", reason: null, stats: stats(), hops: null, samples: [[0, 15.2], [1000, 16]] },
        // A probe whose samples key is absent (A4: omitted, never null) draws nothing.
        { method: "FloUdpPing", outcome: "ok", reason: null, stats: stats(), hops: null },
      ],
    },
  ],
};

test("direct comes before proxied", () => {
  assert.deepEqual(orderedPaths(target).map((p) => p.path), ["direct", "proxied"]);
});

test("RTT series overlay, per path, the MTR final hop and the ping samples; lost samples are gaps; proxied is dashed", () => {
  const series = rttSeries(target, ["#111111", "#222222", "#333333"]);
  assert.deepEqual(series.map((s) => s.label), ["Direct · ICMP MTR (final hop 1.2.3.4)", "Direct · TCP ping", "Proxied (US East 4 -> US East 3) · Flo UDP ping (flo nodes only)"]);
  assert.deepEqual(series[0].points, [{ x: 0, y: 14.8 }, { x: 6, y: null }]);
  assert.deepEqual(series[1].points, [{ x: 0, y: 15.2 }, { x: 1, y: 16 }]);
  assert.deepEqual(series[2].points, [{ x: 0, y: 20.5 }, { x: 1, y: null }]);
  assert.deepEqual(series.map((s) => s.dash), [[], [], [6, 3]]);
  assert.deepEqual(series.map((s) => s.color), ["#111111", "#222222", "#333333"]);
});

test("final hop is the highest TTL; an MTR without final-hop samples or without hops adds no line", () => {
  assert.equal(finalHop([{ ttl: 3, ip: null, stats: noReplies }, { ttl: 7, ip: "9.9.9.9", stats: stats() }, { ttl: 5, ip: "8.8.8.8", stats: stats() }])?.ip, "9.9.9.9");
  assert.equal(finalHop([]), null);
  assert.equal(finalHop(null), null);
  const silentFinalHop: TargetResultDto = {
    targetKey: "core:bigboi",
    label: "bigboi",
    paths: [{
      path: "direct",
      routeLabel: null,
      endpoints: { icmp: "203.0.113.10", tcp: null, udp: null },
      probes: [
        { method: "TcpMtr", outcome: "ok", reason: null, stats: stats(), hops: [{ ttl: 1, ip: "192.168.1.1", stats: stats(), samples: [[0, 1]] }, { ttl: 2, ip: "203.0.113.10", stats: stats() }] },
        { method: "IcmpTraceroute", outcome: "ok", reason: null, stats: null, hops: [{ ttl: 1, ip: "192.168.1.1", stats: stats(), samples: [[0, 1]] }] },
      ],
    }],
  };
  assert.deepEqual(rttSeries(silentFinalHop, ["#111111"]), [], "earlier hops and traceroute hops are not charted");
});

test("raw expired (samples keys omitted): no series and the expiry notice; other raw states", () => {
  const expired = nullHeavy();
  const expiredTarget = expired.targets![0];
  assert.equal("samples" in expiredTarget.paths![0].probes![0], false);
  assert.deepEqual(rttSeries(expiredTarget, ["#111111"]), []);
  assert.equal(rawSamplesNotice(expired, true), RAW_EXPIRED_NOTICE);
  assert.equal(RAW_EXPIRED_NOTICE.startsWith("Raw data expired (>90 days)"), true);
  assert.equal(rawSamplesNotice(expired, false), null, "nothing to say before the raw series was requested");
  assert.equal(rawSamplesNotice({ ...expired, rawExpired: false }, true), NO_RAW_SAMPLES_NOTICE);
  assert.equal(rawSamplesNotice({ ...expired, rawExpired: false, targets: [target] }, true), null);
  assert.equal(rawSamplesNotice({ rawExpired: false }, true), NO_RAW_SAMPLES_NOTICE, "a payload without targets must not throw");
  assert.equal(rawSamplesNotice({ targets: [{ ...target, paths: undefined }] }, true), NO_RAW_SAMPLES_NOTICE);
});

test("endpoints line skips missing protocols", () => {
  assert.equal(endpointsLine({ icmp: "1.2.3.4", tcp: "1.2.3.4:3554", udp: null }), "ICMP 1.2.3.4 · TCP 1.2.3.4:3554");
  assert.equal(endpointsLine({ icmp: null, tcp: null, udp: null }), "—");
});

test("snapshot rows: sorted by node, flo max shown as p95, loss rate as percent, unhealthy flagged", () => {
  const row = (overrides: Partial<FloSnapshotRow>): FloSnapshotRow => ({
    nodeId: 1,
    nodeName: "B",
    routeLabel: null,
    transport: "QUIC",
    health: "ok",
    controllerStatus: null,
    min: 10,
    max: 15,
    avg: 12,
    stddev: 0.8,
    current: 12,
    lossRate: 0.02,
    p50: 12,
    p90: 14,
    p99: 16,
    maxTrue: 40,
    samples: 256,
    windowMs: 3800000,
    ...overrides,
  });
  const rows = snapshotRows([row({}), row({ nodeId: 2, nodeName: "A", health: "timeout", routeLabel: "A -> C", samples: null, lossRate: null })]);
  assert.deepEqual(rows.map((r) => r.node), ["A", "B"]);
  assert.equal(rows[1].p95, "15.0 ms");
  assert.equal(rows[1].maxTrue, "40.0 ms");
  assert.equal(rows[1].loss, "2.0%");
  assert.equal(rows[1].samples, "256 over 1 h 3 min");
  assert.equal(rows[1].route, "direct");
  assert.equal(rows[0].route, "A -> C");
  assert.equal(rows[0].healthColor, "error");
  assert.equal(rows[1].healthColor, "success");
  assert.equal(rows[0].samples, "—");
  assert.equal(rows[0].loss, "—");
});

test("system lines", () => {
  assert.equal(adapterLine({ name: "Ethernet 2", kind: "ethernet", linkSpeedMbps: 1000, mtu: 1500, gateway: "192.168.1.1", dns: null, hasDefaultRoute: true, rxBps: null, txBps: null, upSince: null, upSinceReason: null }), "Ethernet 2 · ethernet · 1000 Mbps · MTU 1500 · gateway 192.168.1.1 · default route");
  // A8: rx/tx are bits per second.
  assert.equal(adapterLine({ name: "Wi-Fi", kind: "wifi", linkSpeedMbps: null, mtu: null, gateway: null, dns: null, hasDefaultRoute: null, rxBps: 12000, txBps: 3_500_000, upSince: null, upSinceReason: null }), "Wi-Fi · wifi · rx 12.0 kbit/s · tx 3.5 Mbit/s");
  assert.equal(
    adapterLine({ name: "eth0", kind: "ethernet", dns: ["192.168.1.1", "1.1.1.1"], upSince: "2026-10-09T14:05:00Z", upSinceReason: "ignored when the time is known" }),
    "eth0 · ethernet · DNS 192.168.1.1, 1.1.1.1 · up since 2026-10-09 14:05 UTC",
  );
  assert.equal(adapterLine({ name: "eth0", kind: "ethernet", dns: [], upSince: null, upSinceReason: "<b>not_reported</b>" }), "eth0 · ethernet · up since unknown: <b>not_reported</b>", "reason verbatim; empty DNS adds nothing");
  assert.equal(adapterLine({ name: "eth0", kind: "ethernet", upSince: null, upSinceReason: "" }), "eth0 · ethernet");
  assert.equal(formatBitRate(999), "999 bit/s");
  assert.equal(formatBitRate(1000), "1.0 kbit/s");
  assert.equal(formatBitRate(null), "—");
  assert.equal(wifiLine({ rssiDbm: -55, noiseDbm: -90, channel: 36, band: "5GHz", txRateMbps: 573, reason: null }), "RSSI -55 dBm · noise -90 dBm · channel 36 (5GHz) · 573 Mbps");
  assert.equal(wifiLine({ rssiDbm: null, noiseDbm: null, channel: null, band: null, txRateMbps: null, reason: "not_on_wifi" }), "unavailable: not_on_wifi");
  assert.equal(wifiLine(null), "—");
  assert.equal(wifiLine({ rssiDbm: -80, channel: 6, reason: "stale_scan" }), "RSSI -80 dBm · channel 6 (reason: stale_scan)", "values and reason are not exclusive");
  assert.equal(antivirusLine({ thirdParty: ["Kaspersky"], reason: "partial" }), "Kaspersky (reason: partial)");
  assert.equal(vpnLine({ suspected: false, evidence: [] }), "not detected");
  assert.equal(antivirusLine({ thirdParty: [], reason: null }), "none detected");
  assert.equal(antivirusLine({ thirdParty: [], reason: "wmi_denied" }), "unknown: wmi_denied");
});

/** Walks returned values: no string may mention undefined/NaN, no number may be NaN, no member may be undefined. */
function assertNoUndefinedOrNaN(value: unknown, path = "$"): void {
  assert.notEqual(value, undefined, path);
  if (typeof value === "number") assert.ok(!Number.isNaN(value), `${path} is NaN`);
  else if (typeof value === "string") assert.ok(!/undefined|NaN/.test(value), `${path}: ${value}`);
  else if (Array.isArray(value)) value.forEach((item, i) => assertNoUndefinedOrNaN(item, `${path}[${i}]`));
  else if (value !== null && typeof value === "object") Object.entries(value).forEach(([key, item]) => assertNoUndefinedOrNaN(item, `${path}.${key}`));
}

test("absent keys (omitted, not null) render dashes and empty results through every function", () => {
  // The backend may omit null members; none of these objects carries the optional keys.
  const hop = { ttl: 1 };
  const probe = { method: "IcmpMtr", outcome: "ok", hops: [hop] } as ProbeDto;
  const bare: MeasurementDetailDto = {
    measurementId: "m-2",
    runId: "r-2",
    battleTag: "Name#1234",
    submittedAt: "2026-10-12T10:00:00Z",
    clientIp: null,
    clientGeo: null,
    os: null,
    primaryAdapterType: null,
    vpnSuspected: null,
    targetCount: 1,
    restarts: 0,
    attemptStartedAt: "2026-10-12T09:57:00Z",
    windowStartedAt: "2026-10-12T09:58:00Z",
    windowEndedAt: "2026-10-12T09:59:00Z",
    floSnapshot: [],
    ipInfo: {},
    targets: [{ targetKey: "gateway", label: "Default gateway", paths: [{ path: "direct", endpoints: {}, probes: [probe, { method: "TcpPing", outcome: "ok" }] }] }],
  };
  const everything = [
    measurementFacts(bare),
    hopRows([hop]),
    hopEnrichment([hop, { ttl: 2, ip: "1.1.1.1" }], { "1.1.1.1": {} }),
    probeStatsLine(probe),
    endpointsLine({}),
    snapshotRows([{ nodeId: 1, nodeName: "A" }]),
    adapterLine({ name: "eth0", kind: "ethernet" }),
    wifiLine({}),
    cpuLine({}),
    memoryLine({}),
    vpnLine({ suspected: true }),
    antivirusLine({ thirdParty: [] }),
  ];
  assertNoUndefinedOrNaN(everything);
  for (const fact of measurementFacts(bare)) assert.ok(!/undefined|null|NaN/.test(fact.value), `${fact.label}: ${fact.value}`);
  assert.equal(new Map(measurementFacts(bare).map((f) => [f.label, f.value])).get("OS"), "—");
  assert.deepEqual(hopRows([hop]), [{ hopNumber: 1, host: null, avgRttMs: null, minRttMs: null, maxRttMs: null, stddevMs: null, lossPercent: null }]);
  assert.deepEqual(hopEnrichment([hop, { ttl: 2, ip: "1.1.1.1" }], { "1.1.1.1": {} }), [null, { asn: null, asnOrg: null, city: null, country: null }]);
  assert.equal(probeStatsLine(probe), "—");
  assert.equal(endpointsLine({}), "—");
  assert.equal(finalHop([hop])?.ttl, 1);
  assert.deepEqual(rttSeries(bare.targets![0], ["#111111"]), []);
  assert.equal(rawSamplesNotice(bare, true), NO_RAW_SAMPLES_NOTICE);
  const [snap] = snapshotRows([{ nodeId: 1, nodeName: "A" }]);
  assert.deepEqual([snap.route, snap.transport, snap.health, snap.healthColor, snap.current, snap.p95, snap.loss, snap.samples], ["direct", "—", "—", "grey", "—", "—", "—", "—"]);
  assert.equal(adapterLine({ name: "eth0", kind: "ethernet" }), "eth0 · ethernet");
  assert.equal(formatBitRate(undefined), "—");
  assert.equal(wifiLine({}), "—");
  assert.equal(cpuLine({}), "—");
  assert.equal(memoryLine({}), "—");
  assert.equal(vpnLine({ suspected: true }), "suspected: no detail");
  assert.equal(antivirusLine({ thirdParty: [] }), "none detected");
});

test("a path without endpoints reads as a dash (real backend: endpoints null)", () => {
  assert.equal(endpointsLine(null), "—");
  assert.equal(endpointsLine(undefined), "—");
});

test("snapshot rows without a node name show the node id and still sort (real backend: nodeName null)", () => {
  const row = (nodeId: number, nodeName: string | null): FloSnapshotRow => ({ nodeId, nodeName });
  const rows = snapshotRows([row(9, null), row(1, "PTR EU"), row(3, null)]);
  assert.deepEqual(rows.map((r) => r.node), ["Node 3", "Node 9", "PTR EU"]);
});

test("pacing with null members shows only what is known, never 'null ms'", () => {
  const pacing = (p: MeasurementDetailDto["pacing"]): string => measurementFacts({ ...nullHeavy(), pacing: p }).find((f) => f.label === "Pacing")!.value;
  assert.equal(pacing({ mtrRoundMs: 6000, pingIntervalMs: null, streams: null }), "MTR round 6000 ms");
  assert.equal(pacing({ mtrRoundMs: null, pingIntervalMs: 1000, streams: 12 }), "ping every 1000 ms · 12 streams");
  assert.equal(pacing({ mtrRoundMs: null, pingIntervalMs: null, streams: null }), "—");
  assert.equal(pacing({}), "—");
});

test("route facts and VPN client evidence are shown whether or not a VPN is suspected", () => {
  assert.equal(
    vpnLine({ suspected: false, evidence: ["routes to 1.1.1.1 and 9 more: en0 (wifi)", "VPN client running: Tailscale"] }),
    "not detected — routes to 1.1.1.1 and 9 more: en0 (wifi); VPN client running: Tailscale",
  );
  assert.equal(vpnLine({ suspected: true, evidence: ["route to 100.64.0.7: utun4 (vpn)"] }), "suspected: route to 100.64.0.7: utun4 (vpn)");
  assert.equal(vpnLine({ suspected: false, evidence: null }), "not detected");
  assert.equal(vpnLine({ suspected: null, evidence: ["default route: en0 (wifi)"] }), "—", "no verdict stays a dash");
  assert.equal(vpnLine(null), "—");
});

test("vpnLine drops blank entries, caps the list at six and passes markup through as plain text", () => {
  assert.equal(vpnLine({ suspected: true, evidence: [] }), "suspected: no detail");
  assert.equal(vpnLine({ suspected: false, evidence: [] }), "not detected");
  assert.equal(vpnLine({ suspected: true, evidence: [""] }), "suspected: no detail");
  assert.equal(vpnLine({ suspected: false, evidence: ["", "  "] }), "not detected");
  assert.equal(vpnLine({ suspected: true, evidence: ["a", "b"] }), "suspected: a; b");
  const eight = ["e1", "", "e2", "e3", "e4", "e5", "e6", "e7", "e8"];
  assert.equal(vpnLine({ suspected: true, evidence: eight }), "suspected: e1; e2; e3; e4; e5; e6 (+2 more)");
  assert.equal(vpnLine({ suspected: false, evidence: eight.slice(0, 7) }), "not detected — e1; e2; e3; e4; e5; e6 (+1 more)");
  assert.equal(vpnLine({ suspected: false, evidence: ["e1", "e2", "e3", "e4", "e5", "e6"] }), "not detected — e1; e2; e3; e4; e5; e6");
  assert.equal(vpnLine({ suspected: true, evidence: ["<img onerror=x>"] }), "suspected: <img onerror=x>");
});

test("measurementFacts shows route evidence for a result with no VPN suspected", () => {
  const detail = { system: { vpn: { suspected: false, evidence: ["route to 1.1.1.1: en0 (wifi)", "route to 157.90.1.251: en0 (wifi)", "VPN client running: Tailscale"] } } } as MeasurementDetailDto;
  const byLabel = new Map(measurementFacts(detail).map((f) => [f.label, f.value]));
  assert.equal(byLabel.get("VPN"), "not detected — route to 1.1.1.1: en0 (wifi); route to 157.90.1.251: en0 (wifi); VPN client running: Tailscale");
});

test("a VPN object without a verdict is a dash, not 'not detected'", () => {
  assert.equal(vpnLine({ suspected: null }), "—");
  assert.equal(vpnLine({ suspected: false }), "not detected");
});

test("a null ipInfo entry or a null ipInfo map adds no GeoIP facts", () => {
  const hops: HopDto[] = [{ ttl: 1, ip: "10.0.0.1" }];
  assert.deepEqual(hopEnrichment(hops, { "10.0.0.1": null }), [null]);
  assert.deepEqual(hopEnrichment(hops, null), [null]);
});

test("stats line only for probes that sent something (unsupported and error probes carry zeros)", () => {
  const probe = (outcome: ProbeDto["outcome"], s: StatsDto | null): ProbeDto => ({ method: "TcpPing", outcome, stats: s });
  assert.equal(hasProbeStats(probe("ok", stats())), true);
  assert.equal(hasProbeStats(probe("timeout", stats({ received: 0, lossPct: 100 }))), true);
  assert.equal(hasProbeStats(probe("unsupported", stats({ sent: 0, received: 0, lossPct: null }))), false);
  assert.equal(hasProbeStats(probe("error", noReplies)), false);
  assert.equal(hasProbeStats(probe("ok", null)), false);
  assert.equal(probeStatsLine(probe("unsupported", stats({ sent: 0, received: 0, lossPct: null, p50Ms: null }))).includes("null"), false);
});

test("client-supplied path, method, outcome and key: unknown strings as sent, null as a dash, never a wrong label", () => {
  assert.equal(pathLabel("direct"), "Direct");
  assert.equal(pathLabel("proxied"), "Proxied");
  assert.equal(pathLabel("relay"), "relay");
  assert.equal(pathLabel(null), "—");
  assert.equal(pathLabel(undefined), "—");
  assert.equal(methodLabel("TcpPing"), "TCP ping");
  assert.equal(methodLabel("QuicPing"), "QuicPing");
  assert.equal(methodLabel(null), "—");
  assert.equal(methodLabel("constructor"), "constructor");
  assert.equal(outcomeText("ok"), "ok");
  assert.equal(outcomeText("weird"), "weird");
  assert.equal(outcomeText(null), "—");
  assert.equal(outcomeColor("ok"), "success");
  assert.equal(outcomeColor("weird"), "grey");
  assert.equal(outcomeColor(null), "grey");
  assert.equal(targetTitle({ label: null, targetKey: "flo:1" }), "flo:1");
  assert.equal(targetTitle({ label: null, targetKey: null }), "—");
});

test("a null path sorts last, reads as a dash in the chart legend and is not drawn dashed", () => {
  const sample: ProbeDto = { method: "TcpPing", outcome: "ok", samples: [[0, 10]] };
  const target: TargetResultDto = { targetKey: "gateway", label: null, paths: [{ path: null, probes: [sample] }, { path: "direct", probes: [sample] }] };
  assert.deepEqual(orderedPaths(target).map((p) => p.path), ["direct", null]);
  const series = rttSeries(target, ["#111111", "#222222"]);
  assert.deepEqual(series.map((s) => s.label), ["Direct · TCP ping", "— · TCP ping"]);
  assert.deepEqual(series[1].dash, []);
  const unknown = rttSeries({ ...target, paths: [{ path: "relay", probes: [sample] }] }, ["#111111"]);
  assert.deepEqual(unknown.map((s) => s.label), ["relay · TCP ping"]);
});

test("MTR notes: TCP MTR explains its last hop and the loss reading, ICMP MTR only the loss reading, others nothing", () => {
  assert.deepEqual(mtrNotes("TcpMtr"), [TCP_MTR_LAST_HOP_NOTE, MTR_LOSS_NOTE]);
  assert.deepEqual(mtrNotes("IcmpMtr"), [MTR_LOSS_NOTE]);
  assert.deepEqual(mtrNotes("TcpPing"), []);
  assert.deepEqual(mtrNotes(null), []);
  assert.deepEqual(mtrNotes(undefined), []);
});

test("pacing shows the ICMP send gap in ms without trailing zeros, and is unchanged without it", () => {
  const pacing = (p: MeasurementDetailDto["pacing"]): string => measurementFacts({ ...nullHeavy(), pacing: p }).find((f) => f.label === "Pacing")!.value;
  const base = { mtrRoundMs: 6000, pingIntervalMs: 1000, streams: 330 };
  const today = "MTR round 6000 ms · ping every 1000 ms · 330 streams";
  assert.equal(pacing({ ...base, icmpSendGapUs: 2000 }), `${today} · ICMP send gap 2 ms`);
  assert.equal(pacing({ ...base, icmpSendGapUs: 500 }), `${today} · ICMP send gap 0.5 ms`);
  assert.equal(pacing({ ...base, icmpSendGapUs: 1250 }), `${today} · ICMP send gap 1.25 ms`);
  assert.equal(pacing({ ...base, icmpSendGapUs: null }), today);
  assert.equal(pacing(base), today);
  assert.equal(pacing({ icmpSendGapUs: 2000 }), "ICMP send gap 2 ms");
});
