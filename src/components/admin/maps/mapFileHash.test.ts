import { describe, expect, it } from "vitest";
import { sha1Hex } from "./mapFileHash";

describe("sha1Hex", () => {
  it("matches the published SHA-1 of the empty input", async () => {
    await expect(sha1Hex(new Blob([]))).resolves.toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
  });

  it("matches the published SHA-1 of the string abc", async () => {
    // The update service stores the SHA-1 of the whole map file, so the digest
    // computed here has to be the plain one, in lower-case hex.
    await expect(sha1Hex(new Blob(["abc"]))).resolves.toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });

  it("pads bytes that are smaller than 0x10", async () => {
    const digest = await sha1Hex(new Blob(["The quick brown fox jumps over the lazy dog"]));

    expect(digest).toBe("2fd4e1c67a2d28fced849ee1bb76e7391b93eb12");
    expect(digest).toHaveLength(40);
  });
});
