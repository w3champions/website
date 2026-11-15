import { describe, expect, it } from "vitest";
import { dateToCurrentTimeDate } from "@/helpers/date-functions";

describe("dateToCurrentTimeDate", () => {
  const now = new Date("2026-02-10T19:39:49.603Z");
  it("keeps a day that does not exist in the current month", () => {
    expect(dateToCurrentTimeDate("2026-03-31", now)).toBe("2026-03-31T19:39:49.603Z");
  });
  it("takes the day from the text and the time of day from now, in UTC", () => {
    expect(dateToCurrentTimeDate("2027-01-01", new Date("2026-12-31T23:59:59.999Z"))).toBe("2027-01-01T23:59:59.999Z");
  });
  it("answers an empty text for an empty, malformed or impossible date", () => {
    expect(dateToCurrentTimeDate("", now)).toBe("");
    expect(dateToCurrentTimeDate("31.03.2026", now)).toBe("");
    expect(dateToCurrentTimeDate("2026-02-30", now)).toBe("");
  });
});
