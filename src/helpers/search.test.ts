import { describe, it } from "vitest";
import { strict as assert } from "node:assert";
import { meetsSearchMinimum } from "./search";

// The cases mirror the server gate on api/players/global-search: at least 3 characters that are
// letters or digits (char.IsLetterOrDigit), everything else carrying no weight.
describe("meetsSearchMinimum", () => {
  it("accepts a plain 3-letter term", () => {
    assert.equal(meetsSearchMinimum("moo"), true);
  });

  it("rejects a 2-letter term", () => {
    assert.equal(meetsSearchMinimum("mo"), false);
  });

  it("rejects 2 letters padded to length 3 by a trailing space", () => {
    assert.equal(meetsSearchMinimum("mo "), false);
  });

  it("rejects 2 letters padded by a leading space", () => {
    assert.equal(meetsSearchMinimum(" mo"), false);
  });

  it("accepts 3 letters split by an inner space", () => {
    assert.equal(meetsSearchMinimum("mo o"), true);
  });

  it("counts digits as letters (battleTag discriminators)", () => {
    assert.equal(meetsSearchMinimum("ab#123"), true);
  });

  it("rejects punctuation-only input", () => {
    assert.equal(meetsSearchMinimum("#--"), false);
  });

  it("rejects zero-width characters (the padding the server gate exists to stop)", () => {
    assert.equal(meetsSearchMinimum("\u200b\u200b\u200b"), false);
  });

  it("accepts non-Latin letters", () => {
    assert.equal(meetsSearchMinimum("손오공"), true);
  });

  it("rejects empty string, null and undefined", () => {
    assert.equal(meetsSearchMinimum(""), false);
    assert.equal(meetsSearchMinimum(null), false);
    assert.equal(meetsSearchMinimum(undefined), false);
  });
});
