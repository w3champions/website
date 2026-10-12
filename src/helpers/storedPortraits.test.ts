import { describe, expect, it, vi } from "vitest";
import { nextPortraitId, storedPortraitId, unregisteredPortraitFiles } from "./storedPortraits";
import type { CloudFile } from "@/store/admin/cloudStorage/types";
vi.mock("@/config/env", () => ({ INGAME_STATIC_RESOURCES_URL: "/" }));
const file = (name: string, previewPath?: string): CloudFile => ({ name, previewPath, size: 10, lastModified: new Date() });

describe("S3 portrait selection", () => {
  it("derives a supported ID and rejects files that cannot be displayed as portraits", () => {
    expect(storedPortraitId(file("SPECIAL_120.jpg"))).toBe(120);
    expect(storedPortraitId(file("SPECIAL_120.jpg", "icons/specialAvatars/SPECIAL_120.jpg"))).toBe(120);
    for (const name of ["banner.jpg", "SPECIAL_0.jpg", "SPECIAL_0120.jpg", "SPECIAL_120.webp", "SPECIAL_2147483648.jpg"]) {
      expect(storedPortraitId(file(name))).toBeNull();
    }
    expect(storedPortraitId(file("SPECIAL_120.jpg", "images/SPECIAL_120.jpg"))).toBeNull();
  });
  it("only offers compatible files missing from the catalogue", () => {
    const available = unregisteredPortraitFiles([file("SPECIAL_120.jpg"), file("SPECIAL_121.jpg"), file("banner.png")], [{ id: "120", groups: [] }]);
    expect(available.map((item) => item.name)).toEqual(["SPECIAL_121.jpg"]);
  });
});

it("reserves IDs occupied by stored images even when they are missing from the catalogue", () => {
  expect(nextPortraitId([{ id: "120", groups: [] }], [file("SPECIAL_121.jpg"), file("banner.png")])).toBe(122);
  expect(nextPortraitId([], [])).toBe(1);
  expect(() => nextPortraitId([], [file("SPECIAL_2147483647.jpg")])).toThrow("No more portrait IDs");
});
