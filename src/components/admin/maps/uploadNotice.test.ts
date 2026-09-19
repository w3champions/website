import { describe, expect, it } from "vitest";
import { UploadFailureInput, uploadFailureNotice } from "./uploadNotice";

const TIMED_OUT = "Uploading the map file timed out after 300 s. It is not known whether the file was stored; "
  + "the map's file list shows whether it was.";
const SHA_A = "d3486ae9136e7856bc42212385ea797094475802";
const SHA_B = "0a0a9f2a6772942557ab5355d76af442f8f65e01";

function input(overrides: Partial<UploadFailureInput> = {}): UploadFailureInput {
  return {
    error: TIMED_OUT,
    outcomeUnknown: true,
    storedAsName: "5110_twisted_meadows.w3x",
    storedFiles: [],
    pickedSha1: SHA_A,
    ...overrides,
  };
}

describe("uploadFailureNotice", () => {
  it("says the upload went through when a stored file matches by name and checksum", () => {
    const notice = uploadFailureNotice(input({
      storedFiles: [{ name: "5110_twisted_meadows.w3x", sha1: SHA_A }],
    }));

    expect(notice).toContain(TIMED_OUT);
    expect(notice).toContain("It did go through");
    expect(notice).toContain("do not upload it again");
  });

  it("does not claim success for a namesake that holds different content", () => {
    // Another admin stored a file under this name while the dialog was open, so
    // the upload was rejected rather than applied - selecting that file would
    // point the map at the wrong bytes.
    const notice = uploadFailureNotice(input({
      storedFiles: [{ name: "5110_twisted_meadows.w3x", sha1: SHA_B }],
    }));

    expect(notice).not.toContain("It did go through");
    expect(notice).toContain("holds different content");
    expect(notice).toContain("different name");
  });

  it("does not claim success when the stored file carries no checksum", () => {
    const notice = uploadFailureNotice(input({
      storedFiles: [{ name: "5110_twisted_meadows.w3x", sha1: null }],
    }));

    expect(notice).not.toContain("It did go through");
    expect(notice).toContain("could not be checked");
  });

  it("does not claim success when the picked file could not be hashed", () => {
    // crypto.subtle missing: the namesake may or may not be this file, and the
    // notice has to say so rather than pick an answer.
    const notice = uploadFailureNotice(input({
      pickedSha1: null,
      storedFiles: [{ name: "5110_twisted_meadows.w3x", sha1: SHA_A }],
    }));

    expect(notice).not.toContain("It did go through");
    expect(notice).toContain("could not be checked");
  });

  it("leaves a timeout alone when no stored file has that name", () => {
    expect(uploadFailureNotice(input({ storedFiles: [{ name: "5110_other.w3x", sha1: SHA_A }] }))).toBe(TIMED_OUT);
  });

  it("compares names and checksums regardless of letter case and surrounding space", () => {
    const notice = uploadFailureNotice(input({
      storedAsName: " 5110_Twisted_Meadows.w3x ",
      pickedSha1: SHA_A.toUpperCase(),
      storedFiles: [{ name: "5110_twisted_meadows.w3x", sha1: SHA_A }],
    }));

    expect(notice).toContain("It did go through");
  });

  it("does not claim anything about a failure that was not a timeout", () => {
    // "File already exists" means the upload was refused, not that it landed.
    const error = "File already exists: `/uploads/maps/W3Champions/5110_twisted_meadows.w3x`";

    const notice = uploadFailureNotice(input({
      error,
      outcomeUnknown: false,
      storedFiles: [{ name: "5110_twisted_meadows.w3x", sha1: SHA_A }],
    }));

    expect(notice).toBe(error);
  });

  it("leaves a timeout alone when nothing was picked to store", () => {
    expect(uploadFailureNotice(input({ storedAsName: "", storedFiles: [{ name: "", sha1: SHA_A }] }))).toBe(TIMED_OUT);
  });
});
