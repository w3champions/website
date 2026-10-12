import { test } from "vitest";
import { strict as assert } from "node:assert";
import { measurementFilterParams, NetworkDiagnosticsService, runsQueryParams } from "./NetworkDiagnosticsService";
import { HttpError } from "@/services/http/AuthorizedClient";
import type { CreateRunRequest, ObservationDto } from "@/store/admin/networkDiagnostics/types";

interface Call {
  url: string;
  method: string;
  body: unknown;
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/** Answers the n-th request with responses[n] (the last one repeats). */
function serviceWith(...responses: Array<{ status: number; body?: unknown; truncated?: boolean }>) {
  const calls: Call[] = [];
  const impl: typeof globalThis.fetch = (input, init) => {
    const response = responses[Math.min(calls.length, responses.length - 1)];
    calls.push({
      url: urlOf(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? JSON.parse(init.body) as unknown : undefined,
    });
    const body = response.body === undefined ? null : JSON.stringify(response.body);
    const headers: Record<string, string> = body === null ? {} : { "Content-Type": "application/json" };
    if (response.truncated) headers["X-NetDiag-Truncated"] = "true";
    return Promise.resolve(new Response(body, { status: response.status, headers }));
  };
  return { calls, service: new NetworkDiagnosticsService({ endpoint: "https://api.example.com", fetch: impl }) };
}

function observation(measurementId: string): ObservationDto {
  return { measurementId } as ObservationDto;
}

test("filter params repeat runId and measurementId, keep the BattleTag exact and leave out empty values", () => {
  const params = measurementFilterParams({ battleTag: "Name#1234", runIds: ["r1", "r2"], measurementIds: [], targetKey: "", asn: 3320, vpn: false });

  assert.deepEqual(params.getAll("runId"), ["r1", "r2"]);
  assert.equal(params.get("battleTag"), "Name#1234");
  assert.ok(params.toString().includes("battleTag=Name%231234"), "the # must be encoded");
  assert.equal(params.get("asn"), "3320");
  assert.equal(params.get("vpn"), "false", "false is a filter value, not an absent one");
  assert.equal(params.has("targetKey"), false);
  assert.equal(params.has("measurementId"), false);
});

test("runs query sends zero-based paging and only the filters that are set", () => {
  const params = runsQueryParams({ createdBy: "Admin#1", page: 2, pageSize: 25 });

  assert.equal(params.get("createdBy"), "Admin#1");
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("pageSize"), "25");
  assert.equal(params.has("from"), false);
});

test("getRuns calls the runs endpoint with the query", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { items: [], total: 0 } });

  await service.getRuns("tok", { page: 0, pageSize: 25 });

  assert.equal(calls[0].url, "https://api.example.com/api/network-diagnostics/runs?page=0&pageSize=25");
});

test("createRun posts the request body", async () => {
  const request: CreateRunRequest = {
    audience: { kind: "Users", battleTags: ["Name#1234"] },
    targets: { floNodeIds: [12], allFloNodes: false, coreServers: [], baselines: [], customTargets: [], includeDefaultGateway: true },
    methods: ["IcmpMtr"],
    allowDuringGame: false,
    windowSeconds: 60,
  };
  const { service, calls } = serviceWith({ status: 201, body: { id: "run-1" } });

  const run = await service.createRun("tok", request);

  assert.equal(run.id, "run-1");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url, "https://api.example.com/api/network-diagnostics/runs");
  assert.deepEqual(calls[0].body, request);
});

test("getRun and cancelRun encode the run id; cancel is a POST", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await service.getRun("tok", "a/b");
  await service.cancelRun("tok", "a/b");

  assert.equal(calls[0].url, "https://api.example.com/api/network-diagnostics/runs/a%2Fb");
  assert.equal(calls[1].url, "https://api.example.com/api/network-diagnostics/runs/a%2Fb/cancel");
  assert.equal(calls[1].method, "POST");
});

test("cancelRun surfaces 409 as an HttpError", async () => {
  const { service } = serviceWith({ status: 409, body: { error: "already_cancelled" } });

  const error = await service.cancelRun("tok", "r").then(() => null, (e: unknown) => e);

  assert.ok(error instanceof HttpError);
  assert.equal(error.status, 409);
});

test("getMeasurements caps pageSize at 100", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { items: [], total: 0 } });

  await service.getMeasurements("tok", { battleTag: "A#1234" }, 0, 500);

  const query = new URL(calls[0].url).searchParams;
  assert.equal(query.get("pageSize"), "100");
  assert.equal(query.get("page"), "0");
  assert.equal(query.get("battleTag"), "A#1234");
});

test("getMeasurement passes the raw flag", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await service.getMeasurement("tok", "m-1", true);
  await service.getMeasurement("tok", "m-1", false);

  assert.equal(calls[0].url, "https://api.example.com/api/network-diagnostics/measurements/m-1?raw=true");
  assert.equal(calls[1].url, "https://api.example.com/api/network-diagnostics/measurements/m-1?raw=false");
});

test("getAggregate joins groupBy with commas and adds the filters", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { groupBy: ["asn", "path"], rows: [] } });

  await service.getAggregate("tok", ["asn", "path"], { runIds: ["r1"], method: "TcpPing" });

  const query = new URL(calls[0].url).searchParams;
  assert.equal(query.get("groupBy"), "asn,path");
  assert.equal(query.get("runId"), "r1");
  assert.equal(query.get("method"), "TcpPing");
});

test("getAggregate rejects 0 or more than 3 group keys without a request", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await assert.rejects(service.getAggregate("tok", [], {}), RangeError);
  await assert.rejects(service.getAggregate("tok", ["asn", "path", "method", "os"], {}), RangeError);
  assert.equal(calls.length, 0);
});

test("getObservations asks for JSON with cursor and a limit of at most 5000", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { items: [], nextCursor: null } });

  await service.getObservations("tok", { targetKey: "flo:12" }, "c1", 9000);

  const query = new URL(calls[0].url).searchParams;
  assert.equal(query.get("format"), "json");
  assert.equal(query.get("cursor"), "c1");
  assert.equal(query.get("limit"), "5000");
  assert.equal(query.get("targetKey"), "flo:12");
});

test("getObservationsUpTo follows the cursor and stops at the cap, reporting truncation", async () => {
  const { service, calls } = serviceWith(
    { status: 200, body: { items: [observation("a"), observation("b")], nextCursor: "c1" } },
    { status: 200, body: { items: [observation("c"), observation("d")], nextCursor: "c2" } },
  );

  const result = await service.getObservationsUpTo("tok", {}, 3);

  assert.deepEqual(result.items.map((o) => o.measurementId), ["a", "b", "c"]);
  assert.equal(result.truncated, true);
  assert.equal(calls.length, 2);
  const second = new URL(calls[1].url).searchParams;
  assert.equal(second.get("cursor"), "c1");
  assert.equal(second.get("limit"), "1", "the last page asks only for the rows still missing");
});

test("getObservationsUpTo is not truncated when the cursor runs out", async () => {
  const { service } = serviceWith({ status: 200, body: { items: [observation("a")], nextCursor: null } });

  const result = await service.getObservationsUpTo("tok", {}, 10);

  assert.equal(result.items.length, 1);
  assert.equal(result.truncated, false);
});

test("getObservationsUpTo stops on an empty page that still carries a cursor, reporting truncation", async () => {
  const { service, calls } = serviceWith(
    { status: 200, body: { items: [observation("a")], nextCursor: "c1" } },
    { status: 200, body: { items: [], nextCursor: "c2" } },
  );

  const result = await service.getObservationsUpTo("tok", {}, 10);

  assert.deepEqual(result.items.map((o) => o.measurementId), ["a"]);
  assert.equal(result.truncated, true);
  assert.equal(calls.length, 2, "no third request: the empty page ends the loop");
});

test("getAggregate reports the truncation header beside the body", async () => {
  const body = { groupBy: ["country"], rows: [] };
  const { service } = serviceWith({ status: 200, body, truncated: true }, { status: 200, body });

  assert.deepEqual(await service.getAggregate("tok", ["country"], {}), { data: body, truncated: true });
  assert.deepEqual(await service.getAggregate("tok", ["country"], {}), { data: body, truncated: false });
});

test("getMeasurements reports the truncation header beside the page", async () => {
  const body = { items: [], total: 0 };
  const { service } = serviceWith({ status: 200, body, truncated: true }, { status: 200, body });

  assert.deepEqual(await service.getMeasurements("tok", {}, 0, 25), { data: body, truncated: true });
  assert.deepEqual(await service.getMeasurements("tok", {}, 0, 25), { data: body, truncated: false });
});

test("getObservations reports the truncation header beside the page", async () => {
  const body = { items: [], nextCursor: null };
  const { service } = serviceWith({ status: 200, body, truncated: true });

  assert.deepEqual(await service.getObservations("tok", {}, null, 10), { data: body, truncated: true });
});

test("getObservationsUpTo is truncated when any page carries the truncation header, even after the cursor ran out", async () => {
  const { service } = serviceWith(
    { status: 200, body: { items: [observation("a")], nextCursor: "c1" }, truncated: true },
    { status: 200, body: { items: [observation("b")], nextCursor: null } },
  );

  const result = await service.getObservationsUpTo("tok", {}, 10);

  assert.deepEqual(result.items.map((o) => o.measurementId), ["a", "b"]);
  assert.equal(result.truncated, true);
});
