import { afterEach, beforeAll, test, vi } from "vitest";
import { strict as assert } from "node:assert";

const ID_URL = "https://id.example.com/";

vi.mock("@/config/env", () => ({ REDIRECT_URL: "https://app.example.com/" }));

let AuthorizationService: typeof import("./AuthorizationService").default;

beforeAll(async () => {
  // The module reads window._env_ at import time and the suite runs in the node environment.
  vi.stubGlobal("window", { _env_: { IDENTIFICATION_URL: ID_URL } });
  AuthorizationService = (await import("./AuthorizationService")).default;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jwtExpiringIn(seconds: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64({ exp: Math.floor(Date.now() / 1000) + seconds })}.sig`;
}

function mockFetch(status: number, body: unknown = { battleTag: "Foo#1" }) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  vi.stubGlobal("fetch", (input: string, init: RequestInit) => {
    calls.push({ url: input, init });
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  });
  return calls;
}

function assertBearerNoQuery(call: { url: string; init: RequestInit }, jwt: string) {
  assert.equal(call.url, `${ID_URL}api/oauth/user-info`);
  assert.ok(!call.url.includes("jwt"), "jwt must not appear in the URL");
  const headers = call.init.headers as Record<string, string>;
  assert.equal(headers.Authorization, `Bearer ${jwt}`);
}

test("getProfile sends the JWT as a Bearer header, not in the URL", async () => {
  const calls = mockFetch(200);
  const jwt = jwtExpiringIn(3600);
  const profile = await AuthorizationService.getProfile(jwt);
  assert.deepEqual(profile, { battleTag: "Foo#1" });
  assert.equal(calls.length, 1);
  assertBearerNoQuery(calls[0], jwt);
});

test("getProfile returns null for a non-200 response", async () => {
  mockFetch(401);
  assert.equal(await AuthorizationService.getProfile("x.y.z"), null);
});

test("getSessionProfile sends the JWT as a Bearer header, not in the URL", async () => {
  const calls = mockFetch(200);
  const jwt = jwtExpiringIn(3600);
  const result = await AuthorizationService.getSessionProfile(jwt);
  assert.equal(result.status, "valid");
  assert.deepEqual(result.profile, { battleTag: "Foo#1" });
  assertBearerNoQuery(calls[0], jwt);
});

test("getSessionProfile maps 401/403 to invalid and 5xx to error", async () => {
  const jwt = jwtExpiringIn(3600);
  mockFetch(401);
  assert.equal((await AuthorizationService.getSessionProfile(jwt)).status, "invalid");
  mockFetch(403);
  assert.equal((await AuthorizationService.getSessionProfile(jwt)).status, "invalid");
  mockFetch(503);
  assert.equal((await AuthorizationService.getSessionProfile(jwt)).status, "error");
});

test("getSessionProfile treats an expired JWT as invalid without calling the network", async () => {
  const calls = mockFetch(200);
  const result = await AuthorizationService.getSessionProfile(jwtExpiringIn(-60));
  assert.equal(result.status, "invalid");
  assert.equal(calls.length, 0);
});

test("getSessionProfile reports error when fetch throws", async () => {
  vi.stubGlobal("fetch", () => Promise.reject(new TypeError("network")));
  assert.equal((await AuthorizationService.getSessionProfile(jwtExpiringIn(3600))).status, "error");
});
