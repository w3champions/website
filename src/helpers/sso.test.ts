import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAllowedReturnUrl } from "./sso.ts";

const PROD_ORIGIN = "https://identification-service.w3champions.com";
const TEST_ORIGIN = "https://identification-service.test.w3champions.com";

describe("isAllowedReturnUrl", () => {
  it("allows exact prod-origin with path and query", () => {
    assert.equal(
      isAllowedReturnUrl(
        "https://identification-service.w3champions.com/connect/handoff?return=foo",
        PROD_ORIGIN,
      ),
      true,
    );
  });

  it("allows test-origin when configured as test", () => {
    assert.equal(
      isAllowedReturnUrl(
        "https://identification-service.test.w3champions.com/connect/handoff",
        TEST_ORIGIN,
      ),
      true,
    );
  });

  it("rejects prod-origin when configured as test", () => {
    assert.equal(
      isAllowedReturnUrl(
        "https://identification-service.w3champions.com/connect/handoff",
        TEST_ORIGIN,
      ),
      false,
    );
  });

  it("rejects different hostname", () => {
    assert.equal(
      isAllowedReturnUrl(
        "https://evil.com/connect/handoff",
        PROD_ORIGIN,
      ),
      false,
    );
  });

  it("rejects lookalike subdomain (open-redirect attempt)", () => {
    assert.equal(
      isAllowedReturnUrl(
        "https://identification-service.w3champions.com.evil.com/connect/handoff",
        PROD_ORIGIN,
      ),
      false,
    );
  });

  it("rejects http when allowed origin is https", () => {
    assert.equal(
      isAllowedReturnUrl(
        "http://identification-service.w3champions.com/connect/handoff",
        PROD_ORIGIN,
      ),
      false,
    );
  });

  it("rejects internal path string /player/...", () => {
    assert.equal(
      isAllowedReturnUrl(
        "/player/SomePlayer%231234",
        PROD_ORIGIN,
      ),
      false,
    );
  });

  it("rejects empty string", () => {
    assert.equal(
      isAllowedReturnUrl("", PROD_ORIGIN),
      false,
    );
  });

  it("rejects javascript: URL", () => {
    assert.equal(
      isAllowedReturnUrl("javascript:alert(1)", PROD_ORIGIN),
      false,
    );
  });
});
