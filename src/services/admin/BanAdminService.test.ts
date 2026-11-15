import assert from "node:assert/strict";
import { afterEach, beforeEach, test, vi } from "vitest";
import { machineIdRow, tagStatus } from "@/store/admin/bans/fixtures.testing";
import { BanAdminService, BanApiError } from "./BanAdminService";

vi.mock("@/config/env", () => ({ API_URL: "https://api.example.com/" }));

interface Call {
  url: string;
  method: string;
  body: unknown;
  auth: string | null;
}

const BASE = "https://api.example.com/api/admin/bans";
let calls: Call[];
let next: { text: string; status: number };

function respond(body: unknown, status = 200): void {
  next = { text: JSON.stringify(body), status };
}

function respondRaw(text: string, status: number): void {
  next = { text, status };
}

beforeEach(() => {
  calls = [];
  respond({});
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      calls.push({
        url,
        method: init.method ?? "GET",
        body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
        auth: headers.Authorization ?? null,
      });
      return Promise.resolve(new Response(next.text, { status: next.status }));
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

test("list sends only the given query values, encoded", async () => {
  await BanAdminService.list({ status: "inEffect", author: "Helper(bot)", account: "tag:Tester#1001", sort: "ends", dir: "asc", page: 2, pageSize: 25 }, "tok");
  assert.equal(calls[0].url, `${BASE}?status=inEffect&author=Helper(bot)&account=tag%3ATester%231001&sort=ends&dir=asc&page=2&pageSize=25`);
  await BanAdminService.list({}, "tok");
  assert.equal(calls[1].url, BASE);
  assert.equal(calls[0].auth, "Bearer tok");
});

test("account and machine-id routes encode the account key and the machine id", async () => {
  await BanAdminService.account("tag:Tester#1001", "tok");
  respond({ machineIds: [] });
  await BanAdminService.machineIds("1001", "tok");
  await BanAdminService.machineIdAccounts("ab/12", "1001", "tok");
  assert.deepEqual(calls.map((c) => c.url), [`${BASE}/accounts/tag%3ATester%231001`, `${BASE}/accounts/1001/machine-ids`, `${BASE}/machine-ids/ab%2F12/accounts?excludeAccount=1001`]);
});

test("lookup sends q encoded, non-ASCII included", async () => {
  await BanAdminService.lookup("Тестер#1002", "tok");
  assert.equal(calls[0].url, `${BASE}/account-lookup?q=${encodeURIComponent("Тестер#1002")}`);
});

test("writes use the contract's methods and paths and never send actor or machineAccess", async () => {
  await BanAdminService.create({ accountKey: "1001", type: "regular", allGameModes: true, gameModes: [], permanent: true, endDate: null, banReason: "Test reason one" }, "tok");
  await BanAdminService.edit("b1", { version: 1, banReason: "Test reason two" }, "tok");
  await BanAdminService.revoke("b1", "Test note", "tok");
  await BanAdminService.machineImpact("1001", ["aa"], "tok");
  respond({ statuses: [] });
  await BanAdminService.status(["Tester#1001"], "tok");
  assert.deepEqual(calls.map((c) => [c.method, c.url]), [["POST", BASE], ["PATCH", `${BASE}/b1`], ["POST", `${BASE}/b1/revoke`], ["POST", `${BASE}/machine-impact`], ["POST", `${BASE}/status`]]);
  assert.deepEqual([calls[2].body, calls[3].body, calls[4].body], [{ note: "Test note" }, { accountKey: "1001", machineIds: ["aa"] }, { battleTags: ["Tester#1001"] }]);
  assert.ok(calls.every((c) => !c.url.includes("machineAccess") && (c.body === undefined || !("actor" in (c.body as object)))));
});

test("single-field answers are unwrapped", async () => {
  respond({ authors: ["Mod One", "Helper(bot)"] });
  assert.deepEqual(await BanAdminService.authors("tok"), ["Mod One", "Helper(bot)"]);
  respond({ machineIds: [machineIdRow()] });
  assert.deepEqual(await BanAdminService.machineIds("1001", "tok"), [machineIdRow()]);
  respond({ statuses: [tagStatus()] });
  assert.deepEqual(await BanAdminService.status(["Tester#1001"], "tok"), [tagStatus()]);
});

test("a refusal throws BanApiError with status, contract code and the server's message", async () => {
  respond({ errors: [{ msg: "machine ban", code: "MACHINE_BAN_PERMISSION" }] }, 403);
  await assert.rejects(BanAdminService.edit("b1", { version: 1 }, "tok"), (e: unknown) => e instanceof BanApiError && e.status === 403 && e.code === "MACHINE_BAN_PERMISSION" && e.message === "machine ban");
});

test("website-backend's own refusals carry no code", async () => {
  respond({ error: "Permission missing." }, 401);
  await assert.rejects(BanAdminService.list({}, "tok"), (e: unknown) => e instanceof BanApiError && e.status === 401 && e.code === undefined);
  respond({ error: "Matchmaking service unavailable" }, 502);
  await assert.rejects(BanAdminService.list({}, "tok"), (e: unknown) => e instanceof BanApiError && e.status === 502 && e.code === undefined);
});

test("an unknown code or an unreadable body gives code undefined", async () => {
  respond({ errors: [{ msg: "x", code: "SOMETHING_ELSE" }] }, 409);
  await assert.rejects(BanAdminService.list({}, "tok"), (e: unknown) => e instanceof BanApiError && e.code === undefined && e.message === "x");
  respondRaw("<html>502</html>", 502);
  await assert.rejects(BanAdminService.list({}, "tok"), (e: unknown) => e instanceof BanApiError && e.code === undefined && e.message === "");
});

test("a network failure is rethrown unchanged", async () => {
  const failure = new TypeError("Failed to fetch");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(failure));
  await assert.rejects(BanAdminService.list({}, "tok"), (e: unknown) => e === failure);
});
