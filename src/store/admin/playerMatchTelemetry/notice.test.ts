import { test } from "vitest";
import { strict as assert } from "node:assert";
import { telemetryNoticeFor } from "./notice";

const loaded = { loading: false, error: null, attempted: true, hasTelemetry: true };

test("shows nothing while the request is in flight", () => {
  assert.equal(telemetryNoticeFor({ ...loaded, loading: true, hasTelemetry: false }), null);
});

test("shows nothing once telemetry loaded successfully", () => {
  assert.equal(telemetryNoticeFor(loaded), null);
});

test("reports a failed request as an error", () => {
  const notice = telemetryNoticeFor({ ...loaded, error: "HTTP 500 for game 42", hasTelemetry: false });

  assert.equal(notice?.type, "error");
  assert.match(notice.text, /HTTP 500 for game 42/);
});

test("reports a request that was never attempted as a warning", () => {
  const notice = telemetryNoticeFor({
    loading: false,
    error: "the lag report did not include a game id.",
    attempted: false,
    hasTelemetry: false,
  });

  assert.equal(notice?.type, "warning");
  assert.match(notice.text, /did not include a game id/);
});

test("distinguishes a genuine 404 from a failure", () => {
  const notice = telemetryNoticeFor({ ...loaded, hasTelemetry: false });

  assert.equal(notice?.type, "info");
  assert.match(notice.text, /No action-latency telemetry was recorded/);
});
