import { describe, expect, it } from "vitest";
import { FailedSaveInput, failedSaveNotice, saveNotice } from "./saveNotice";

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

const TIMED_OUT = "Creating the map timed out after 30 s. It may still have been created; "
  + "check the map list before trying again.";

function failedInput(overrides: Partial<FailedSaveInput> = {}): FailedSaveInput {
  return {
    error: TIMED_OUT,
    outcomeUnknown: true,
    isCreate: true,
    mapName: "Twisted Meadows",
    mapNames: [],
    refreshError: "",
    ...overrides,
  };
}

describe("failedSaveNotice", () => {
  it("says a timed-out create did land when the refreshed list holds the map", () => {
    // Saving again would make a second map, so the notice has to rule it out.
    const notice = failedSaveNotice(failedInput({ mapNames: ["Echo Isles", "Twisted Meadows"] }));

    expect(notice.text).toContain(TIMED_OUT);
    expect(notice.text).toContain("was created");
    expect(notice.text).toContain("do not save it again");
    expect(notice.color).toBe("error");
  });

  it("says a timed-out create did not land when the map is absent", () => {
    const notice = failedSaveNotice(failedInput({ mapNames: ["Echo Isles"] }));

    expect(notice.text).toContain("was not created");
  });

  it("claims nothing about the list when the refresh itself failed", () => {
    // The list is the pre-request snapshot, so it cannot answer either way.
    const notice = failedSaveNotice(failedInput({ mapNames: [], refreshError: "Network error." }));

    expect(notice.text).not.toContain("was not created");
    expect(notice.text).toContain("could not be refreshed");
    expect(notice.text).toContain("Network error.");
  });

  it("stays quiet about the list for an update, which is safe to repeat", () => {
    const notice = failedSaveNotice(failedInput({ isCreate: false, mapNames: ["Twisted Meadows"] }));

    expect(notice.text).toBe(TIMED_OUT);
  });

  it("stays quiet about the list for a failure that was not a timeout", () => {
    const error = "Request failed with status 400.";

    expect(failedSaveNotice(failedInput({ error, outcomeUnknown: false, mapNames: ["Twisted Meadows"] })).text)
      .toBe(error);
  });

  it("reports a failed save as an error even when the refresh worked", () => {
    expect(failedSaveNotice(failedInput()).color).toBe("error");
  });
});
