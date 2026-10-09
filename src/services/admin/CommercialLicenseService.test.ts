import { test } from "vitest";
import { strict as assert } from "node:assert";
import { CommercialLicenseService } from "./CommercialLicenseService";

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
  return { calls, service: new CommercialLicenseService({ endpoint: "https://api.example.com/", fetch: impl }) };
}

test("getTaggedPlayers reads the list with the bearer token", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [{ battleTag: "Foo#1" }] });

  const result = await service.getTaggedPlayers("tok");

  assert.equal(calls[0].url, "https://api.example.com/api/admin/commercial-license/tagged-players");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].auth, "Bearer tok");
  assert.equal(result[0].battleTag, "Foo#1");
});

test("getTaggedPlayers surfaces a failure instead of returning an empty list", async () => {
  const { service } = serviceWith({ status: 403 });

  await assert.rejects(() => service.getTaggedPlayers("tok"));
});

test("upsertTaggedPlayer PUTs note, notify and restrictions to the url-encoded battleTag", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { battleTag: "Foo#1234" } });
  const restrictions = { asPlayer: true, asObserver: false, floTv: "custom" as const };

  await service.upsertTaggedPlayer("tok", "Foo#1234", { note: "n", notify: true, restrictions });

  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].url, "https://api.example.com/api/admin/commercial-license/tagged-players/Foo%231234");
  assert.deepEqual(calls[0].body, { note: "n", notify: true, restrictions });
});

test("removeTaggedPlayer DELETEs the url-encoded battleTag and accepts 204", async () => {
  const { service, calls } = serviceWith({ status: 204 });

  await service.removeTaggedPlayer("tok", "Foo#1234");

  assert.equal(calls[0].method, "DELETE");
  assert.equal(calls[0].url, "https://api.example.com/api/admin/commercial-license/tagged-players/Foo%231234");
});

test("removeTaggedPlayer throws when the player is not tagged", async () => {
  const { service } = serviceWith({ status: 404 });

  await assert.rejects(() => service.removeTaggedPlayer("tok", "Foo#1"));
});

test("getTaggedPlayers normalizes null and missing restrictions", async () => {
  const { service } = serviceWith({
    status: 200,
    body: [
      { battleTag: "A#1", restrictions: null },
      { battleTag: "B#2" },
      { battleTag: "C#3", restrictions: { asPlayer: true, asObserver: false, floTv: "all" } },
    ],
  });

  const result = await service.getTaggedPlayers("tok");

  const none = { asPlayer: false, asObserver: false, floTv: "none" };
  assert.deepEqual(result[0].restrictions, none);
  assert.deepEqual(result[1].restrictions, none);
  assert.deepEqual(result[2].restrictions, { asPlayer: true, asObserver: false, floTv: "all" });
});

test("upsertTaggedPlayer normalizes a null restrictions in the result", async () => {
  const { service } = serviceWith({ status: 200, body: { battleTag: "A#1", restrictions: null } });

  const saved = await service.upsertTaggedPlayer("tok", "A#1", { note: "", notify: true, restrictions: { asPlayer: false, asObserver: false, floTv: "none" } });

  assert.deepEqual(saved.restrictions, { asPlayer: false, asObserver: false, floTv: "none" });
});
