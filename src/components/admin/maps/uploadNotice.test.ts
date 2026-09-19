import { describe, expect, it } from "vitest";
import { uploadFailureNotice } from "./uploadNotice";

const TIMED_OUT = "Uploading the map file timed out after 300 s. It is not known whether the file was stored; "
  + "the map's file list shows whether it was.";

function input(overrides: Partial<Parameters<typeof uploadFailureNotice>[0]> = {}) {
  return {
    error: TIMED_OUT,
    outcomeUnknown: true,
    storedAsName: "5110_twisted_meadows.w3x",
    storedFileNames: [] as string[],
    ...overrides,
  };
}

describe("uploadFailureNotice", () => {
  it("says the upload went through when the re-read list now holds the file", () => {
    // The update service stored it and only the answer went missing. Retrying
    // would collide with the file that is already there, so point at it instead.
    const notice = uploadFailureNotice(input({ storedFileNames: ["5110_twisted_meadows.w3x"] }));

    expect(notice).toContain(TIMED_OUT);
    expect(notice).toContain("It did go through");
    expect(notice).toContain("5110_twisted_meadows.w3x");
    expect(notice).toContain("do not upload it again");
  });

  it("leaves a timeout alone when the file is not in the list", () => {
    // Nothing was stored, or the re-read failed and the list is unchanged.
    // Either way there is nothing to point at.
    expect(uploadFailureNotice(input({ storedFileNames: ["5110_other.w3x"] }))).toBe(TIMED_OUT);
  });

  it("matches the stored name regardless of letter case and surrounding space", () => {
    const notice = uploadFailureNotice(input({
      storedAsName: " 5110_Twisted_Meadows.w3x ",
      storedFileNames: ["5110_twisted_meadows.w3x"],
    }));

    expect(notice).toContain("It did go through");
  });

  it("does not claim anything about a failure that was not a timeout", () => {
    // "File already exists" means the upload was refused, not that it landed -
    // the namesake in the list is someone else's file.
    const error = "File already exists: `/uploads/maps/W3Champions/5110_twisted_meadows.w3x`";

    const notice = uploadFailureNotice(input({
      error,
      outcomeUnknown: false,
      storedFileNames: ["5110_twisted_meadows.w3x"],
    }));

    expect(notice).toBe(error);
  });

  it("leaves a timeout alone when nothing was picked to store", () => {
    expect(uploadFailureNotice(input({ storedAsName: "", storedFileNames: [""] }))).toBe(TIMED_OUT);
  });
});
