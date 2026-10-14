import { describe, expect, it } from "vitest";
import { PortraitStatusRequests } from "./portraitStatusRequests";

describe("portrait status requests", () => {
  it("does not retry a failed lookup on repeated table redraws", () => {
    const requests = new PortraitStatusRequests();
    const ids = requests.begin([120, 121]);
    requests.fail(ids);
    requests.complete(ids);
    for (let redraw = 0; redraw < 5; redraw++) expect(requests.begin([120, 121])).toEqual([]);
    requests.reset();
    expect(requests.begin([120, 121])).toEqual([120, 121]);
  });

  it("avoids duplicate in-flight requests and lets new visible rows load", () => {
    const requests = new PortraitStatusRequests();
    expect(requests.begin([120, 120])).toEqual([120]);
    expect(requests.begin([120, 121])).toEqual([121]);
    requests.complete([120]);
    expect(requests.begin([120, 121])).toEqual([120]);
  });
});
