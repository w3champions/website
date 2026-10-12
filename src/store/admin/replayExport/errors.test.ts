import { test } from "vitest";
import { strict as assert } from "node:assert";
import { HttpError } from "@/services/http/AuthorizedClient";
import { replayExportError } from "./errors";

const http = (status: number, body: string) => new HttpError(status, "POST", "https://x/api/admin/replay-export/preview", body);

test("shows the error text of the backend", () => {
  assert.equal(replayExportError(http(422, JSON.stringify({ error: "The search took too long." }))), "The search took too long.");
  assert.equal(replayExportError(http(429, JSON.stringify({ Error: "Other replay exports are running." }))), "Other replay exports are running.");
});

test("tells the user to sign in again when the token expired", () => {
  assert.equal(replayExportError(http(401, JSON.stringify({ statusCode: 401, error: "AUTH_TOKEN_EXPIRED" }))), "Your sign-in has expired. Sign in again.");
  assert.equal(replayExportError(http(401, JSON.stringify({ error: "Sign in to continue." }))), "Sign in to continue.");
});

test("shows the status when the answer has no error text", () => {
  assert.equal(replayExportError(http(502, "<html>Bad Gateway</html>")), "Request failed (502)");
  assert.equal(replayExportError(http(400, JSON.stringify({ title: "One or more validation errors occurred." }))), "Request failed (400)");
});

test("shows the message of other errors", () => {
  assert.equal(replayExportError(new TypeError("Failed to fetch")), "Failed to fetch");
});
