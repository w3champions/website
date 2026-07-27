import { test } from "vitest";
import { strict as assert } from "node:assert";
import { AuthorizedClient, HttpError } from "./AuthorizedClient";

interface Recorded {
  url: string;
  init: RequestInit;
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function recordingFetch(responses: Array<{ status: number; body?: unknown }>) {
  const calls: Recorded[] = [];
  const queue = [...responses];
  const impl: typeof globalThis.fetch = (input, init) => {
    calls.push({ url: urlOf(input), init: init ?? {} });
    const next = queue.shift() ?? { status: 200, body: {} };
    const body = next.body === undefined ? null : JSON.stringify(next.body);
    return Promise.resolve(
      new Response(body, {
        status: next.status,
        headers: body === null ? undefined : { "Content-Type": "application/json" },
      }),
    );
  };
  return { calls, impl };
}

function clientWith(responses: Array<{ status: number; body?: unknown }>) {
  const { calls, impl } = recordingFetch(responses);
  return { calls, client: new AuthorizedClient({ endpoint: "https://api.example.com/", fetch: impl }) };
}

test("requestJson parses the JSON body", async () => {
  const { client } = clientWith([{ status: 200, body: { hello: "world" } }]);

  const result = await client.getJson<{ hello: string }>("api/thing", "tok");

  assert.deepEqual(result, { hello: "world" });
});

test("attaches the bearer token and accepts JSON", async () => {
  const { client, calls } = clientWith([{ status: 200, body: {} }]);

  await client.getJson("api/thing", "tok-123");

  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer tok-123");
  assert.equal(headers.Accept, "application/json");
});

test("sets Content-Type only when a body is sent", async () => {
  const { client, calls } = clientWith([{ status: 200, body: {} }, { status: 200, body: {} }]);

  await client.getJson("api/thing", "tok");
  await client.requestJson("POST", "api/thing", "tok", { a: 1 });

  assert.equal((calls[0].init.headers as Record<string, string>)["Content-Type"], undefined);
  assert.equal((calls[1].init.headers as Record<string, string>)["Content-Type"], "application/json");
  assert.equal(calls[1].init.body, JSON.stringify({ a: 1 }));
});

test("joins the endpoint and path without doubling slashes", async () => {
  const { client, calls } = clientWith([{ status: 200, body: {} }, { status: 200, body: {} }]);

  await client.getJson("api/thing", "tok");
  await client.getJson("/api/other", "tok");

  assert.equal(calls[0].url, "https://api.example.com/api/thing");
  assert.equal(calls[1].url, "https://api.example.com/api/other");
});

test("throws HttpError carrying the status on a non-OK response", async () => {
  const { client } = clientWith([{ status: 500, body: { message: "boom" } }]);

  const error = await client.getJson("api/thing", "tok").then(() => null, (e: unknown) => e);

  assert.ok(error instanceof HttpError, "expected an HttpError");
  assert.equal(error.status, 500);
  assert.equal(error.method, "GET");
  assert.match(error.message, /500/);
  assert.match(error.message, /api\/thing/);
});

test("getJson treats 404 as an error", async () => {
  const { client } = clientWith([{ status: 404 }]);

  const error = await client.getJson("api/thing", "tok").then(() => null, (e: unknown) => e);

  assert.ok(error instanceof HttpError);
  assert.equal(error.status, 404);
});

test("getJsonOrNull returns null for 404 but still throws on other failures", async () => {
  const { client } = clientWith([{ status: 404 }, { status: 503 }]);

  assert.equal(await client.getJsonOrNull("api/thing", "tok"), null);

  const error = await client.getJsonOrNull("api/thing", "tok").then(() => null, (e: unknown) => e);
  assert.ok(error instanceof HttpError);
  assert.equal(error.status, 503);
});

test("invokes the global fetch with a valid receiver on the non-injected path", async () => {
  const originalFetch = globalThis.fetch;
  let receiverIsGlobal = false;
  let receiverLabel = "fetch was never called";
  globalThis.fetch = function(this: unknown): Promise<Response> {
    receiverIsGlobal = this === undefined || this === globalThis;
    receiverLabel = receiverIsGlobal ? "the global object" : "the client instance";
    return Promise.resolve(
      new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
  };

  try {
    // Constructed after the swap so the default (production) path picks it up.
    await new AuthorizedClient({ endpoint: "https://api.example.com/" }).getJson("api/thing", "tok");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // Firefox brand-checks fetch's receiver and rejects a call whose `this` is the
  // client; Chromium tolerates it. Node does not check, so assert it directly.
  assert.ok(receiverIsGlobal, `global fetch must not be called as a method (receiver: ${receiverLabel})`);
});
