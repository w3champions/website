import { describe, expect, it } from "vitest";
import { saveNotice } from "./saveNotice";

describe("saveNotice", () => {
  it("reports a write that landed and refreshed as a plain success", () => {
    expect(saveNotice("Selected 5110_twisted_meadows.w3x for Twisted Meadows.", "")).toEqual({
      text: "Selected 5110_twisted_meadows.w3x for Twisted Meadows.",
      color: "success",
    });
  });

  it("keeps a failed refresh in the same message, so it cannot be replaced", () => {
    // The page has one snackbar: a second message would simply overwrite the
    // first, and the admin would never learn the table is stale.
    const notice = saveNotice("Twisted Meadows is now enabled.", "Error trying to reload the maps.");

    expect(notice.text).toContain("Twisted Meadows is now enabled.");
    expect(notice.text).toContain("Error trying to reload the maps.");
    expect(notice.color).toBe("warning");
  });

  it("does not call a stale table a failed write", () => {
    expect(saveNotice("The map was saved.", "Network error.").color).not.toBe("error");
  });
});
