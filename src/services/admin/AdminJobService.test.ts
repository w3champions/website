import { test } from "vitest";
import { strict as assert } from "node:assert";
import { AdminJobService } from "./AdminJobService";

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function serviceWith(response: { status: number; body?: unknown }) {
  const calls: { url: string; method: string }[] = [];
  const impl: typeof globalThis.fetch = (input, init) => {
    calls.push({ url: urlOf(input), method: init?.method ?? "GET" });
    const body = response.body === undefined ? null : JSON.stringify(response.body);
    return Promise.resolve(
      new Response(body, {
        status: response.status,
        headers: body === null ? undefined : { "Content-Type": "application/json" },
      }),
    );
  };
  return {
    calls,
    service: new AdminJobService({ endpoint: "https://api.example.com/", fetch: impl }),
  };
}

test("getJobs reads the jobs list", async () => {
  const { service, calls } = serviceWith({ status: 200, body: [{ key: "timeline-backfill" }] });

  const jobs = await service.getJobs("tok");

  assert.equal(calls[0].url, "https://api.example.com/api/admin/jobs");
  assert.equal(jobs[0].key, "timeline-backfill");
});

test("getJobs surfaces a failure rather than returning an empty list", async () => {
  const { service } = serviceWith({ status: 403 });

  // An empty array would render as "no jobs are registered", which is a very
  // different thing from "you may not see them".
  await assert.rejects(() => service.getJobs("tok"));
});

test("runJob posts to the job's run endpoint", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { key: "a" } });

  await service.runJob("a", "tok");

  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url, "https://api.example.com/api/admin/jobs/a/run");
});

test("runJob encodes a key that needs it", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await service.runJob("odd key/with#chars", "tok");

  assert.equal(calls[0].url, "https://api.example.com/api/admin/jobs/odd%20key%2Fwith%23chars/run");
});

test("force and reset are only sent when asked for", async () => {
  const plain = serviceWith({ status: 200, body: {} });
  await plain.service.runJob("a", "tok");
  assert.equal(plain.calls[0].url, "https://api.example.com/api/admin/jobs/a/run");

  const both = serviceWith({ status: 200, body: {} });
  await both.service.runJob("a", "tok", { force: true, reset: true });
  assert.equal(both.calls[0].url, "https://api.example.com/api/admin/jobs/a/run?force=true&reset=true");
});

test("a conflict is reported as a state change, not an error", async () => {
  const { service } = serviceWith({ status: 409 });

  const result = await service.runJob("a", "tok");

  // The job was started or stopped between the page's last poll and the click.
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "conflict");
});

test("a permission failure names the action that was refused", async () => {
  const { service } = serviceWith({ status: 403 });

  const result = await service.cancelJob("a", "tok");

  assert.equal(result.ok === false && result.reason, "forbidden");
  assert.match(result.ok === false ? result.message : "", /cancel/);
});

test("any other failure carries its status", async () => {
  const { service } = serviceWith({ status: 500 });

  const result = await service.runJob("a", "tok");

  assert.equal(result.ok === false && result.reason, "error");
  assert.match(result.ok === false ? result.message : "", /500/);
});

test("cancelJob posts to the cancel endpoint", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { key: "a" } });

  await service.cancelJob("a", "tok");

  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url, "https://api.example.com/api/admin/jobs/a/cancel");
});
