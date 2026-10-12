import { describe, expect, it } from "vitest";
import { compactStorageDate, compactStorageSize, preciseStorageDate, preciseStorageSize } from "./storageFileFormatting";
import type { CloudFile } from "@/store/admin/cloudStorage/types";
const file = (sizeBytes?: number): CloudFile => ({ name: "image.jpg", size: 1, sizeBytes, lastModified: new Date() });

describe("storage file formatting", () => {
  it("uses a compact 24-hour date in the browser timezone", () => {
    expect(compactStorageDate("2026-09-25T16:00:00.123Z", "America/Toronto")).toBe("Sep 25 '26 12:00");
    expect(compactStorageDate("2026-09-25T00:00:00Z", "UTC")).toBe("Sep 25 '26 00:00");
    expect(compactStorageDate("invalid")).toBe("—");
  });
  it("keeps the exact UTC instant and timezone in the tooltip", () => {
    const text = preciseStorageDate("2026-09-25T16:00:00.123Z", "America/Toronto");
    expect(text).toContain("September 25, 2026");
    expect(text).toContain("EDT");
    expect(text).toContain("2026-09-25T16:00:00.123Z");
  });
  it("formats sizes with units and exact bytes", () => {
    expect(compactStorageSize(file(0))).toBe("0 B");
    expect(compactStorageSize(file(512))).toBe("512 B");
    expect(compactStorageSize(file(1536))).toBe("1.5 KB");
    expect(compactStorageSize(file(1048576))).toBe("1 MB");
    expect(preciseStorageSize(file(1536))).toBe("1,536 bytes");
    expect(preciseStorageSize(file())).toBe("Approximately 1,024 bytes");
  });
});
