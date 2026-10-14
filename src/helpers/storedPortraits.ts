import type { CloudFile } from "@/store/admin/cloudStorage/types";
import type { PortraitDefinition } from "@/store/admin/types";
import { INGAME_STATIC_RESOURCES_URL } from "@/config/env";

export function storedPortraitId(file: CloudFile): number | null {
  const match = /^SPECIAL_([1-9]\d*)\.jpg$/.exec(file.name);
  if (!match) return null;
  const id = Number(match[1]);
  if (!Number.isSafeInteger(id) || id > 2147483647) return null;
  if (file.previewPath && file.previewPath !== `icons/specialAvatars/${file.name}`) return null;
  return id;
}

export function unregisteredPortraitFiles(files: CloudFile[], portraits: PortraitDefinition[]): CloudFile[] {
  const registered = new Set(portraits.map((portrait) => Number(portrait.id)));
  return files.filter((file) => {
    const id = storedPortraitId(file);
    return id !== null && !registered.has(id);
  });
}

export function storedPortraitPreviewUrl(file: CloudFile): string {
  const path = file.previewPath ?? `icons/specialAvatars/${file.name}`;
  const modified = new Date(file.lastModified).getTime();
  return `${INGAME_STATIC_RESOURCES_URL}${path.split("/").map(encodeURIComponent).join("/")}?v=${Number.isFinite(modified) ? modified : 2}`;
}

export function nextPortraitId(portraits: PortraitDefinition[], files: CloudFile[]): number {
  const ids = [...portraits.map((portrait) => Number(portrait.id)), ...files.map(storedPortraitId).filter((id): id is number => id !== null)];
  const next = Math.max(0, ...ids.filter((id) => Number.isSafeInteger(id) && id > 0)) + 1;
  if (next > 2147483647) throw new Error("No more portrait IDs are available.");
  return next;
}
