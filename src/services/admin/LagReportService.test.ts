import { test } from "vitest";
import { strict as assert } from "node:assert";
import { LagReportService } from "./LagReportService";
import { HttpError } from "@/services/http/AuthorizedClient";
import type { LagReportQueryParams } from "@/store/admin/lagReports/types";

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function serviceWith(response: { status: number; body?: unknown }) {
  const urls: string[] = [];
  const impl: typeof globalThis.fetch = (input) => {
    urls.push(urlOf(input));
    const body = response.body === undefined ? null : JSON.stringify(response.body);
    return Promise.resolve(
      new Response(body, {
        status: response.status,
        headers: body === null ? undefined : { "Content-Type": "application/json" },
      }),
    );
  };
  return {
    urls,
    service: new LagReportService({ endpoint: "https://api.example.com/", fetch: impl }),
  };
}

const baseParams: LagReportQueryParams = { page: 0, pageSize: 25 };

test("getReport requests the encoded report id", async () => {
  const { service, urls } = serviceWith({ status: 200, body: { id: "abc", gameId: 1 } });

  await service.getReport("tok", "a b#c");

  assert.equal(urls[0], "https://api.example.com/api/lag-reports/a%20b%23c");
});

test("getReports serialises paging and optional filters", async () => {
  const { service, urls } = serviceWith({ status: 200, body: { items: [], total: 0 } });

  await service.getReports("tok", { ...baseParams, battleTag: "Alice#1", explicitOnly: true });

  const query = new URL(urls[0]).searchParams;
  assert.equal(query.get("page"), "0");
  assert.equal(query.get("pageSize"), "25");
  assert.equal(query.get("battleTag"), "Alice#1");
  assert.equal(query.get("explicitOnly"), "true");
  assert.equal(query.get("serverName"), null, "absent filters must not be sent");
});

test("getReport throws instead of parsing an error body as a report", async () => {
  // Previously this returned `await response.json()` unconditionally, so a 401
  // body was handed back to the store typed as a LagReportDetail.
  const { service } = serviceWith({ status: 401, body: { message: "Permission missing." } });

  const error = await service.getReport("tok", "abc").then(() => null, (e: unknown) => e);

  assert.ok(error instanceof HttpError, "expected an HttpError");
  assert.equal(error.status, 401);
});

test("getReports throws instead of returning an error body as a page", async () => {
  const { service } = serviceWith({ status: 500, body: { message: "boom" } });

  const error = await service.getReports("tok", baseParams).then(() => null, (e: unknown) => e);

  assert.ok(error instanceof HttpError);
  assert.equal(error.status, 500);
});
