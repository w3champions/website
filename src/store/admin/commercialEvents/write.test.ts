import { test, vi } from "vitest";
import { strict as assert } from "node:assert";
import { HttpError } from "@/services/http/AuthorizedClient";
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
