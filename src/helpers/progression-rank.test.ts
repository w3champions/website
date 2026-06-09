// Pure-helper unit tests, run with native Node (no bundler / test-runner dependency):
//   node --experimental-strip-types --test src/helpers/progression-rank.test.ts
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { rankingSystemForSeason } from "./progression-rank.ts";

describe("rankingSystemForSeason", () => {
  it("returns rp when progressionStartSeason is null (mode not opted in / reverted)", () => {
    assert.equal(rankingSystemForSeason(null, 5), "rp");
    assert.equal(rankingSystemForSeason(null, -1), "rp");
  });
  it("returns rp when progressionStartSeason is undefined (mode absent from activeModes)", () => {
    assert.equal(rankingSystemForSeason(undefined, 5), "rp");
  });
  it("returns rp for a season id of -1 (no-season sentinel), which is simply before any opt-in season", () => {
    assert.equal(rankingSystemForSeason(5, -1), "rp");
  });
  it("returns rp for a historical season before opt-in", () => {
    assert.equal(rankingSystemForSeason(5, 4), "rp");
  });
  it("returns progression at the inclusive opt-in boundary", () => {
    assert.equal(rankingSystemForSeason(5, 5), "progression");
  });
  it("returns progression for a season after opt-in", () => {
    assert.equal(rankingSystemForSeason(5, 6), "progression");
  });
  it("returns progression at the season-0 boundary", () => {
    assert.equal(rankingSystemForSeason(0, 0), "progression");
  });
});
