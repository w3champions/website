import { describe, expect, it } from "vitest";
import { parseWc3Text, stripWc3Text } from "./wc3Text";

describe("parseWc3Text", () => {
  it("returns nothing for empty or missing input", () => {
    expect(parseWc3Text(undefined)).toEqual([]);
    expect(parseWc3Text("")).toEqual([]);
  });

  it("returns a single uncoloured segment for plain text", () => {
    expect(parseWc3Text("Twisted Meadows")).toEqual([{ text: "Twisted Meadows" }]);
  });

  it("splits a colour run out of the surrounding text", () => {
    expect(parseWc3Text("by |cff00ff00Blizzard|r Entertainment")).toEqual([
      { text: "by " },
      { text: "Blizzard", color: "#00ff00" },
      { text: " Entertainment" },
    ]);
  });

  it("drops the alpha byte, which map authors do not use as web alpha", () => {
    // `|c00RRGGBB` and `|cffRRGGBB` mean the same colour in-game.
    expect(parseWc3Text("|c00ff8000Orange")).toEqual([{ text: "Orange", color: "#ff8000" }]);
  });

  it("carries a colour to the end of the string when |r never arrives", () => {
    expect(parseWc3Text("|cffff0000unterminated")).toEqual([
      { text: "unterminated", color: "#ff0000" },
    ]);
  });

  it("turns |n into a real line break", () => {
    expect(parseWc3Text("line one|nline two")).toEqual([{ text: "line one\nline two" }]);
  });

  it("unescapes a doubled pipe to a single literal pipe", () => {
    expect(parseWc3Text("A || B")).toEqual([{ text: "A | B" }]);
  });

  it("leaves an unrecognised pipe sequence as the author typed it", () => {
    expect(parseWc3Text("50|% water")).toEqual([{ text: "50|% water" }]);
  });

  it("leaves a malformed colour tag alone rather than eating the text after it", () => {
    // Only 6 hex digits, not 8 — not a colour tag, so nothing may be consumed.
    expect(parseWc3Text("|cff0000red")).toEqual([{ text: "|cff0000red" }]);
  });

  it("keeps a trailing pipe at the very end of the string", () => {
    expect(parseWc3Text("ends with a pipe|")).toEqual([{ text: "ends with a pipe|" }]);
  });

  it("handles a colour change with no |r between the runs", () => {
    expect(parseWc3Text("|cffff0000red|cff0000ffblue")).toEqual([
      { text: "red", color: "#ff0000" },
      { text: "blue", color: "#0000ff" },
    ]);
  });
});

describe("stripWc3Text", () => {
  it("returns the readable text with every colour code removed", () => {
    expect(stripWc3Text("|cff00ff00Echo Isles|r (|cffff0000v2|r)")).toBe("Echo Isles (v2)");
  });

  it("returns an empty string for empty or missing input", () => {
    expect(stripWc3Text(undefined)).toBe("");
    expect(stripWc3Text("")).toBe("");
  });

  it("resolves escapes and line breaks alongside the colour codes", () => {
    expect(stripWc3Text("A || B|nC")).toBe("A | B\nC");
  });

  it("leaves text that has no markup exactly as it was", () => {
    expect(stripWc3Text("Turtle Rock v2")).toBe("Turtle Rock v2");
  });
});
