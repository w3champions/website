import { test, vi } from "vitest";
import { strict as assert } from "node:assert";
import { HttpError } from "@/services/http/AuthorizedClient";
import { MAYBE_SAVED_TEXT } from "./errors";
import { runAdminWrite } from "./write";

test("a successful write returns the result, sets saving while running and clears the error", async () => {
  const target = { saving: false, error: "old" };
  let savingWhileRunning = false;

  const result = await runAdminWrite(target, "other", () => {
    savingWhileRunning = target.saving;
    return Promise.resolve(42);
  });

  assert.equal(result, 42);
  assert.equal(savingWhileRunning, true);
  assert.equal(target.saving, false);
  assert.equal(target.error, "");
});

test("a failed write returns null and keeps the mapped message for the context", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const target = { saving: false, error: "" };
  const body = JSON.stringify({ error: "name: too-long", code: "INVALID_FIELD", field: "name", rule: "too-long" });

  const result = await runAdminWrite(target, "allocation", () => Promise.reject(new HttpError(400, "POST", "https://x", body)));

  consoleError.mockRestore();
  assert.equal(result, null);
  assert.equal(target.saving, false);
  assert.equal(target.error, "Name: Use at most 60 characters.");
});

test("a 5xx with a refresh text reloads and asks the admin to check the list", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const target = { saving: false, error: "" };
  const refresh = vi.fn();

  for (const status of [500, 502, 503, 504]) {
    refresh.mockClear();
    const result = await runAdminWrite(target, "event", () => Promise.reject(new HttpError(status, "POST", "https://x", "")), refresh);
    assert.equal(result, null);
    assert.equal(refresh.mock.calls.length, 1);
    assert.equal(target.error, MAYBE_SAVED_TEXT);
  }
  consoleError.mockRestore();
});

test("a 4xx, a network error or a missing refresh does not reload", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const target = { saving: false, error: "" };
  const refresh = vi.fn();

  await runAdminWrite(target, "event", () => Promise.reject(new HttpError(409, "POST", "https://x", "{}")), refresh);
  await runAdminWrite(target, "event", () => Promise.reject(new Error("offline")), refresh);
  assert.equal(refresh.mock.calls.length, 0);

  await runAdminWrite(target, "event", () => Promise.reject(new HttpError(500, "POST", "https://x", "{}")));
  consoleError.mockRestore();
  assert.notEqual(target.error, MAYBE_SAVED_TEXT);
});
