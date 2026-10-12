// Trimmed real website-backend responses (GET observations / GET aggregate, 96a5422b); BattleTags replaced.
import type { AggregateResponseDto, ObservationDto } from "@/store/admin/networkDiagnostics/types";

const RUN_ID = "c34511aa-891e-4c2b-9921-87c0a92536c2";
const NO_RTT = { minMs: null, avgMs: null, maxMs: null, stddevMs: null, p50Ms: null, p90Ms: null, p95Ms: null, p99Ms: null, jitterMs: null, hopCount: 0, lastHopIp: null, lastHopAsn: null };
const FLO_TCP = { runId: RUN_ID, targetKey: "flo:1", targetLabel: "PTR EU", path: "direct", routeLabel: null, method: "TcpPing" } as const;

/** A TCP ping that sent 200 probes and got no answer: outcome `timeout`, 100 % loss, no RTT. */
export const REAL_TIMEOUT_OBSERVATION: ObservationDto = {
  ...FLO_TCP,
  ...NO_RTT,
  measurementId: "29ba61a9-8280-4ed7-bf2e-88f40f6a2543",
  battleTag: "Timeout#1108",
  submittedAt: "2026-10-12T23:05:38.992Z",
  clientIp: "168.126.63.1",
  country: "KR",
  city: "Jongno-gu",
  lat: 37.575,
  lon: 126.9778,
  asn: 4766,
  asnOrg: "Korea Telecom",
  os: "windows",
  primaryAdapterType: "ethernet",
  vpnSuspected: false,
  targetIp: "157.90.1.10",
  outcome: "timeout",
  reason: null,
  sent: 200,
  received: 0,
  lossPct: 100,
};

/** A probe that never ran: nothing sent, no loss figure, no RTT. */
export const REAL_UNSUPPORTED_OBSERVATION: ObservationDto = {
  ...FLO_TCP,
  ...NO_RTT,
  measurementId: "562b9579-b779-4014-8660-f9d2d36d1109",
  battleTag: "NullHeavy#1111",
  submittedAt: "2026-10-12T23:05:39.023Z",
  clientIp: "133.242.0.3",
  country: "JP",
  city: null,
  lat: 35.69,
  lon: 139.69,
  asn: 7684,
  asnOrg: "SAKURA Internet Inc.",
  os: null,
  primaryAdapterType: null,
  vpnSuspected: null,
  targetIp: null,
  outcome: "unsupported",
  reason: "raw_sockets_unavailable",
  sent: 0,
  received: 0,
  lossPct: null,
};

/** An MTR whose target did not answer: the figures are those of the last answering hop. */
export const REAL_UNREACHABLE_OBSERVATION: ObservationDto = {
  ...FLO_TCP,
  method: "IcmpMtr",
  measurementId: "29ba61a9-8280-4ed7-bf2e-88f40f6a2543",
  battleTag: "Timeout#1108",
  submittedAt: "2026-10-12T23:05:38.992Z",
  clientIp: "168.126.63.1",
  country: "KR",
  city: "Jongno-gu",
  lat: 37.575,
  lon: 126.9778,
  asn: 4766,
  asnOrg: "Korea Telecom",
  os: "windows",
  primaryAdapterType: "ethernet",
  vpnSuspected: false,
  targetIp: "157.90.1.10",
  outcome: "unreachable",
  reason: "target_did_not_answer",
  sent: 10,
  received: 9,
  lossPct: 10,
  minMs: 123.05,
  avgMs: 123.58,
  maxMs: 125.138,
  stddevMs: 0.616,
  p50Ms: 123.471,
  p90Ms: 125.138,
  p95Ms: 125.138,
  p99Ms: 125.138,
  jitterMs: 0.633,
  hopCount: 4,
  lastHopIp: "80.81.192.172",
  lastHopAsn: null,
};

/** Grouped by country: DE has samples, JP is one measurement that sent nothing (`shareLossOver1Pct` is 0, not null). */
export const REAL_AGGREGATE_BY_COUNTRY: AggregateResponseDto = {
  groupBy: ["country"],
  rows: [
    { key: { country: "DE" }, count: 3, p50MsMedian: 60.974, p50MsP90: 95.972, lossPctMedian: 0, shareLossOver1Pct: 0.3333, shareUnreachable: 0, asnOrg: null, lat: 49.4903, lon: 9.5922 },
    { key: { country: null }, count: 2, p50MsMedian: 21.332, p50MsP90: 27.225, lossPctMedian: 0, shareLossOver1Pct: 0, shareUnreachable: 0, asnOrg: null, lat: null, lon: null },
    { key: { country: "KR" }, count: 2, p50MsMedian: 123.471, p50MsP90: 211.295, lossPctMedian: 10, shareLossOver1Pct: 1, shareUnreachable: 0.5, asnOrg: null, lat: 37.4725, lon: 126.9624 },
    { key: { country: "JP" }, count: 1, p50MsMedian: null, p50MsP90: null, lossPctMedian: null, shareLossOver1Pct: 0, shareUnreachable: 0, asnOrg: null, lat: 35.69, lon: 139.69 },
  ],
};
