import { test } from "vitest";
import { strict as assert } from "node:assert";
import { HttpError } from "@/services/http/AuthorizedClient";
import { CommercialEventsService, queryString, ROLE_HINTS_BATCH_SIZE } from "./CommercialEventsService";

const BASE = "https://api.example.com/api/admin/commercial-events";

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function serviceWith(response: { status: number; body?: unknown }) {
  const calls: { url: string; method: string; body: unknown; auth: string | null }[] = [];
  const impl: typeof globalThis.fetch = (input, init) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url: urlOf(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      auth: headers.get("Authorization"),
    });
    const body = response.body === undefined ? null : JSON.stringify(response.body);
    return Promise.resolve(
      new Response(body, {
        status: response.status,
        headers: body === null ? undefined : { "Content-Type": "application/json" },
      }),
    );
  };
  return { calls, service: new CommercialEventsService({ endpoint: "https://api.example.com/", fetch: impl }) };
}

test("getAllocations reads the list with the bearer token", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [{ id: "a1" }] });

  const result = await service.getAllocations("tok");

  assert.equal(calls[0].url, `${BASE}/allocations`);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].auth, "Bearer tok");
  assert.equal(result[0].id, "a1");
});

test("createAllocation POSTs the body without actingBattleTag", async () => {
  const { service, calls } = serviceWith({ status: 201, body: { id: "a1" } });
  const request = {
    name: "Spring cup",
    gamesPerPeriod: 50,
    recurrence: "weekly" as const,
    startsAt: "2026-11-01T00:00:00.000Z",
    endsAt: "2026-12-01T00:00:00.000Z",
    allowEventCreation: true,
    adminNote: "",
  };

  await service.createAllocation("tok", request);

  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url, `${BASE}/allocations`);
  assert.deepEqual(calls[0].body, request);
});

test("updateAllocation PUTs only the given fields to the encoded id", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { id: "a/1" } });

  await service.updateAllocation("tok", "a/1", { gamesPerPeriod: 80 });

  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].url, `${BASE}/allocations/a%2F1`);
  assert.deepEqual(calls[0].body, { gamesPerPeriod: 80 });
});

test("member add and remove encode the exact battle tag and send no body", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { id: "a1" } });

  await service.addAllocationMember("tok", "a1", "FooBar#1234");
  await service.removeAllocationMember("tok", "a1", "FooBar#1234");

  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].url, `${BASE}/allocations/a1/members/FooBar%231234`);
  assert.equal(calls[0].body, undefined);
  assert.equal(calls[1].method, "DELETE");
  assert.equal(calls[1].url, `${BASE}/allocations/a1/members/FooBar%231234`);
  assert.equal(calls[1].body, undefined);
});

test("endAllocation POSTs to /end and returns the allocation", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { id: "a1", state: "expired" } });

  const result = await service.endAllocation("tok", "a1");

  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url, `${BASE}/allocations/a1/end`);
  assert.equal(calls[0].body, undefined);
  assert.equal(result.state, "expired");
});

test("deleteAllocation accepts 204", async () => {
  const { service, calls } = serviceWith({ status: 204 });

  await service.deleteAllocation("tok", "a1");

  assert.equal(calls[0].method, "DELETE");
  assert.equal(calls[0].url, `${BASE}/allocations/a1`);
  assert.equal(calls[0].body, undefined);
});

test("getAllocationPeriods reads the periods route", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [] });

  await service.getAllocationPeriods("tok", "a1");

  assert.equal(calls[0].url, `${BASE}/allocations/a1/periods`);
});

test("getEvents sends only non-empty filters, encoded and with q trimmed", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [] });

  await service.getEvents("tok", { status: "open", phase: "", allocationId: "a 1", q: "  Cup #1 " });

  assert.equal(calls[0].url, `${BASE}/events?status=open&allocationId=a%201&q=Cup%20%231`);
});

test("getEvents without filters calls the bare list", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [] });

  await service.getEvents("tok", { status: "", phase: "", allocationId: "", q: "   " });

  assert.equal(calls[0].url, `${BASE}/events`);
});

test("event create, update and detail use the event routes", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { id: "EV-AB23" } });
  const create = {
    allocationId: "a1",
    name: "Cup",
    kind: "tournament" as const,
    prizePoolUsd: 1000,
    startsAt: "2026-11-01T18:00:00.000Z",
    endsAt: "2026-11-02T18:00:00.000Z",
    maxGames: 20,
    adminNote: "",
  };

  await service.createEvent("tok", create);
  await service.updateEvent("tok", "EV-AB23", { name: "Cup 2" });
  await service.getEvent("tok", "EV-AB23");

  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url, `${BASE}/events`);
  assert.deepEqual(calls[0].body, create);
  assert.equal(calls[1].method, "PUT");
  assert.equal(calls[1].url, `${BASE}/events/EV-AB23`);
  assert.deepEqual(calls[1].body, { name: "Cup 2" });
  assert.equal(calls[2].method, "GET");
  assert.equal(calls[2].url, `${BASE}/events/EV-AB23`);
});

test("moveEvent sends the target allocation", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { id: "EV-AB23" } });

  await service.moveEvent("tok", "EV-AB23", "a2");

  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url, `${BASE}/events/EV-AB23/move`);
  assert.deepEqual(calls[0].body, { allocationId: "a2" });
});

test("suspend sends message and note; close and unsuspend send no body", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { id: "EV-AB23" } });

  await service.suspendEvent("tok", "EV-AB23", { suspensionMessage: "Prize pool unclear", adminNote: "ticket 12" });
  await service.closeEvent("tok", "EV-AB23");
  await service.unsuspendEvent("tok", "EV-AB23");

  assert.equal(calls[0].url, `${BASE}/events/EV-AB23/suspend`);
  assert.deepEqual(calls[0].body, { suspensionMessage: "Prize pool unclear", adminNote: "ticket 12" });
  assert.equal(calls[1].url, `${BASE}/events/EV-AB23/close`);
  assert.equal(calls[1].body, undefined);
  assert.equal(calls[2].url, `${BASE}/events/EV-AB23/unsuspend`);
  assert.equal(calls[2].body, undefined);
  assert.deepEqual(calls.map((c) => c.method), ["POST", "POST", "POST"]);
});

test("getEventPeople reads the people route of the encoded event id", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { organizers: [], delegates: [{ battleTag: "Del#1" }], hosts: [] } });

  const people = await service.getEventPeople("tok", "EV/1");

  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].url, `${BASE}/events/EV%2F1/people`);
  assert.equal(people.delegates[0].battleTag, "Del#1");
});

test("people add sends the role to the encoded battle tag; remove sends no body", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { organizers: [], delegates: [], hosts: [] } });

  await service.addEventPerson("tok", "EV-AB23", "Foo#1", "host");
  await service.removeEventPerson("tok", "EV-AB23", "Foo#1");

  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].url, `${BASE}/events/EV-AB23/people/Foo%231`);
  assert.deepEqual(calls[0].body, { role: "host" });
  assert.equal(calls[1].method, "DELETE");
  assert.equal(calls[1].url, `${BASE}/events/EV-AB23/people/Foo%231`);
  assert.equal(calls[1].body, undefined);
});

test("getEventGames passes the opaque cursor and limit only when given", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { games: [] } });

  await service.getEventGames("tok", "EV-AB23");
  await service.getEventGames("tok", "EV-AB23", "a+b/c==", 50);

  assert.equal(calls[0].url, `${BASE}/events/EV-AB23/games`);
  assert.equal(calls[1].url, `${BASE}/events/EV-AB23/games?cursor=a%2Bb%2Fc%3D%3D&limit=50`);
});

test("active games and terminate use the games routes", async () => {
  const list = serviceWith({ status: 200, body: [] });
  await list.service.getActiveGames("tok");
  assert.equal(list.calls[0].url, `${BASE}/games/active`);

  const terminate = serviceWith({ status: 204 });
  await terminate.service.terminateGame("tok", "m 1");
  assert.equal(terminate.calls[0].method, "POST");
  assert.equal(terminate.calls[0].url, `${BASE}/games/m%201/terminate`);
  assert.equal(terminate.calls[0].body, undefined);
});

test("getAudit queries by event or by allocation", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [] });

  await service.getAudit("tok", { eventId: "EV-AB23" });
  await service.getAudit("tok", { allocationId: "a1" });

  assert.equal(calls[0].url, `${BASE}/audit?eventId=EV-AB23`);
  assert.equal(calls[1].url, `${BASE}/audit?allocationId=a1`);
});

test("getRoleHints POSTs exact-case tags as a JSON body to roles/lookup in batches of 200", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [{ battleTag: "x", organizerOf: [], delegateOf: [], hostOf: [] }] });
  const tags = Array.from({ length: ROLE_HINTS_BATCH_SIZE + 1 }, (_, i) => `P${i}#1`);

  const result = await service.getRoleHints("tok", ["Foo#1", "foo#1", "Foo#1", ...tags]);

  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((c) => [c.method, c.url]), [["POST", `${BASE}/roles/lookup`], ["POST", `${BASE}/roles/lookup`]]);
  const [first, second] = calls.map((c) => (c.body as { battleTags: string[] }).battleTags);
  assert.deepEqual(first.slice(0, 3), ["Foo#1", "foo#1", "P0#1"]);
  assert.equal(first.length, ROLE_HINTS_BATCH_SIZE);
  assert.deepEqual(second, ["P198#1", "P199#1", "P200#1"]);
  assert.deepEqual(Object.keys(calls[0].body as object), ["battleTags"]);
  assert.equal(result.length, 2);
});

test("getRoleHints sends nothing for an empty list", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [] });

  assert.deepEqual(await service.getRoleHints("tok", []), []);
  assert.equal(calls.length, 0);
});

test("resolveMatchPageId returns the website match id, or null without a finished match", async () => {
  const found = serviceWith({ status: 200, body: { match: { id: "65f0c0ffee0000000000abcd" }, playerScores: [] } });
  assert.equal(await found.service.resolveMatchPageId("mm-1"), "65f0c0ffee0000000000abcd");
  assert.equal(found.calls[0].url, "https://api.example.com/api/matches/by-ongoing-match-id/mm-1");
  assert.equal(found.calls[0].auth, null);

  const missing = serviceWith({ status: 200, body: { match: null, playerScores: null } });
  assert.equal(await missing.service.resolveMatchPageId("mm-2"), null);
});

test("a refused write surfaces the passthrough body on the HttpError", async () => {
  const body = { error: "EVENT_CLOSED", code: "EVENT_CLOSED" };
  const { service } = serviceWith({ status: 409, body });

  await assert.rejects(
    () => service.closeEvent("tok", "EV-AB23"),
    (e: unknown) => e instanceof HttpError && e.status === 409 && (JSON.parse(e.responseBody) as { code?: string }).code === "EVENT_CLOSED",
  );
});

test("queryString drops empty values and encodes the rest", () => {
  assert.equal(queryString([["a", ""], ["b", undefined], ["c", null]]), "");
  assert.equal(queryString([["q", "a&b"], ["limit", 5]]), "?q=a%26b&limit=5");
});
