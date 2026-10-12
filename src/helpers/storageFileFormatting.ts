import type { CloudFile } from "@/store/admin/cloudStorage/types";

function dateValue(value: Date | string): Date | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function storageDateTimestamp(value: Date | string): string | undefined {
  return dateValue(value)?.toISOString();
}

export function compactStorageDate(value: Date | string, timeZone?: string): string {
  const date = dateValue(value);
  if (!date) return "—";
  const parts = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("month")} ${part("day")} '${part("year")} ${part("hour")}:${part("minute")}`;
}

export function preciseStorageDate(value: Date | string, timeZone?: string): string {
  const date = dateValue(value);
  if (!date) return "Modification date unavailable";
  const local = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "long", timeZone }).format(date);
  return `${local} · UTC: ${date.toISOString()}`;
}

export function storageFileBytes(file: CloudFile): number {
  return file.sizeBytes ?? file.size * 1024;
}

export function compactStorageSize(file: CloudFile): string {
  let size = storageFileBytes(file);
  if (!Number.isFinite(size) || size < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: unit ? 1 : 0 }).format(size)} ${units[unit]}`;
}

export function preciseStorageSize(file: CloudFile): string {
  const bytes = storageFileBytes(file);
  if (!Number.isFinite(bytes) || bytes < 0) return "File size unavailable";
  return `${file.sizeBytes == null ? "Approximately " : ""}${new Intl.NumberFormat("en-US").format(bytes)} bytes`;
}
