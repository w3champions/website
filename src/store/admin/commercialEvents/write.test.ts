import { expect, test, vi } from "vitest";
import { strict as assert } from "node:assert";
import { HttpError } from "@/services/http/AuthorizedClient";
import { MAYBE_SAVED_RELOAD_FAILED_TEXT, MAYBE_SAVED_TEXT } from "./errors";
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
  const refresh = vi.fn(() => Promise.resolve(true));

  for (const status of [500, 502, 503, 504]) {
    refresh.mockClear();
    const result = await runAdminWrite(target, "event", () => Promise.reject(new HttpError(status, "POST", "https://x", "")), refresh);
    assert.equal(result, null);
    assert.equal(refresh.mock.calls.length, 1);
    assert.equal(target.error, MAYBE_SAVED_TEXT);
  }
  consoleError.mockRestore();
});

test("a dropped connection reloads and asks the admin to check the list", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const target = { saving: false, error: "" };
  const refresh = vi.fn(() => Promise.resolve(true));

  const result = await runAdminWrite(target, "event", () => Promise.reject(new TypeError("Failed to fetch")), refresh);

  consoleError.mockRestore();
  assert.equal(result, null);
  assert.equal(refresh.mock.calls.length, 1);
  assert.equal(target.error, MAYBE_SAVED_TEXT);
});

test("saving stays set until the reload after an uncertain write has finished", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const target = { saving: false, error: "" };
  let finishRefresh: (reloaded: boolean) => void = () => undefined;
  const refresh = vi.fn(() => new Promise<boolean>((resolve) => (finishRefresh = resolve)));

  const write = runAdminWrite(target, "event", () => Promise.reject(new HttpError(504, "POST", "https://x", "")), refresh);
  await vi.waitFor(() => assert.equal(refresh.mock.calls.length, 1));
  assert.equal(target.saving, true);
  assert.equal(target.error, "");

  finishRefresh(true);
  await write;
  consoleError.mockRestore();
  assert.equal(target.saving, false);
  assert.equal(target.error, MAYBE_SAVED_TEXT);
});

test("a 4xx or a missing refresh does not reload", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const target = { saving: false, error: "" };
  const refresh = vi.fn(() => Promise.resolve(true));

  await runAdminWrite(target, "event", () => Promise.reject(new HttpError(409, "POST", "https://x", "{}")), refresh);
  assert.equal(refresh.mock.calls.length, 0);

  await runAdminWrite(target, "event", () => Promise.reject(new HttpError(500, "POST", "https://x", JSON.stringify({ code: "INTERNAL" }))));
  consoleError.mockRestore();
  assert.equal(target.error, "Something went wrong in the matchmaking service. Please try again.");
});

test("a reload that fails after an uncertain write asks the admin to reload", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const target = { saving: false, error: "" };

  const result = await runAdminWrite(target, "event", () => Promise.reject(new TypeError("Failed to fetch")), () => Promise.resolve(false));

  consoleError.mockRestore();
  assert.equal(result, null);
  assert.equal(target.error, MAYBE_SAVED_RELOAD_FAILED_TEXT);
});

test("a refresh that rejects is swallowed", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const target = { saving: false, error: "" };
  const refresh = vi.fn(() => Promise.reject(new Error("reload failed")));

  const result = await runAdminWrite(target, "event", () => Promise.reject(new HttpError(504, "POST", "https://x", "")), refresh);
  expect(consoleError).toHaveBeenCalledWith("Refresh after a failed write failed:", expect.any(Error));

  consoleError.mockRestore();
  assert.equal(result, null);
  assert.equal(target.error, MAYBE_SAVED_RELOAD_FAILED_TEXT);
});
