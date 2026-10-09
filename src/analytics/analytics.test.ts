import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeUrlForAnalytics, SENSITIVE_QUERY_PARAMS, trackPageView } from "./analytics";

describe("sanitizeUrlForAnalytics", () => {
  it("strips OAuth params from absolute URLs and keeps the rest", () => {
    expect(sanitizeUrlForAnalytics("https://w3champions.com/login?code=abc&state=xyz&lang=en#top"))
      .toBe("https://w3champions.com/login?lang=en#top");
  });

  it("strips every sensitive param", () => {
    const query = ["code", "state", "jwt", "authorization", "token", "access_token", "ticket"].map((p) => `${p}=secret`).join("&");
    expect(sanitizeUrlForAnalytics(`https://w3champions.com/x?${query}`)).toBe("https://w3champions.com/x");
  });

  it("handles relative paths and keeps other params", () => {
    expect(sanitizeUrlForAnalytics("/login?code=abc&utm_source=a")).toBe("/login?utm_source=a");
    expect(sanitizeUrlForAnalytics("/player/Foo%232?jwt=abc")).toBe("/player/Foo%232");
  });

  it("matches param names case-insensitively, including repeated keys", () => {
    expect(sanitizeUrlForAnalytics("/login?Code=a&JWT=b&Access_Token=c&code=d&lang=en")).toBe("/login?lang=en");
  });

  it("keeps the hash fragment", () => {
    expect(sanitizeUrlForAnalytics("/x?code=a#section")).toBe("/x#section");
  });

  it("leaves URLs without sensitive params unchanged", () => {
    expect(sanitizeUrlForAnalytics("/rankings?season=3")).toBe("/rankings?season=3");
  });
});

describe("analytics-consent.js", () => {
  it("uses the same sensitive param list as sanitizeUrlForAnalytics", () => {
    const source = readFileSync(resolve(process.cwd(), "public/analytics-consent.js"), "utf-8");
    const match = /var sensitiveParams = (\[[^\]]*\])/.exec(source);
    expect(match).not.toBeNull();
    expect(JSON.parse(match![1])).toEqual(SENSITIVE_QUERY_PARAMS);
  });
});

describe("trackPageView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never sends sensitive params to gtag", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", {
      __w3cAnalyticsActive: true,
      gtag,
      location: { href: "https://w3champions.com/login?code=abc&state=xyz" },
    });

    trackPageView("/login?code=abc&state=xyz", "Login");

    expect(gtag).toHaveBeenCalledWith("event", "page_view", {
      page_location: "https://w3champions.com/login",
      page_path: "/login",
      page_title: "Login",
    });
  });
});
