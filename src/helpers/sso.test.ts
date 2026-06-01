import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { isAllowedReturnUrl, isJwtExpired } from "./sso";

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

// Build a JWT-shaped string ("header.payload.signature") whose payload is the
// base64url encoding of the given claims. The signature is a dummy — isJwtExpired
// only reads the payload and does not verify the signature.
function makeJwt(claims: Record<string, unknown>): string {
  const base64url = (obj: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(claims)}.sig`;
}

describe("isJwtExpired", () => {
  it("returns false for an unexpired token", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600; // 1h in the future
    assert.equal(isJwtExpired(makeJwt({ exp })), false);
  });

  it("returns true for an expired token", () => {
    const exp = Math.floor(Date.now() / 1000) - 3600; // 1h in the past
    assert.equal(isJwtExpired(makeJwt({ exp })), true);
  });

  it("returns true for a token with no exp claim", () => {
    assert.equal(isJwtExpired(makeJwt({ sub: "someone" })), true);
  });

  it("returns true for a malformed / non-JWT string", () => {
    assert.equal(isJwtExpired("not-a-jwt"), true);
  });
});
