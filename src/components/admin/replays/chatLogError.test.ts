import { describe, expect, it } from "vitest";
import { describeChatLogFailure } from "./chatLogError";

describe("describeChatLogFailure", () => {
  it("asks for a new login on 401", () => {
    expect(describeChatLogFailure({ status: 401 }).kind).toBe("session-expired");
  });

  it("reports a missing game or replay as unavailable", () => {
    const failure = describeChatLogFailure({ status: 404 });
    expect(failure.kind).toBe("unavailable");
    expect(failure.message).toContain("No chat log available");
  });

  it("reports an archived replay as unavailable", () => {
    const failure = describeChatLogFailure({ status: 410 });
    expect(failure.kind).toBe("unavailable");
    expect(failure.message).toContain("archived");
  });

  it.each([500, 502, undefined])("falls back to a generic error for %s", (status) => {
    expect(describeChatLogFailure({ status }).kind).toBe("error");
  });

  it("falls back to a generic error for non-object errors", () => {
    expect(describeChatLogFailure("boom").kind).toBe("error");
    expect(describeChatLogFailure(null).kind).toBe("error");
  });
});
