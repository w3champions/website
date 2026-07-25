// A map's selected file is stored on the map as a game path ("maps\foo\bar.w3x"),
// while the file list returns storage paths ("foo/bar.w3x"). Normalizing both to a
// lower-case, forward-slashed, "maps/"-less form makes them comparable.
export function normalizeMapFilePath(path?: string): string {
  if (!path) return "";
  return path.replaceAll("\\", "/").replace(/^maps\//i, "").toLowerCase();
}

export function isSameMapFile(a?: string, b?: string): boolean {
  const normalizedA = normalizeMapFilePath(a);
  return normalizedA.length > 0 && normalizedA === normalizeMapFilePath(b);
}

export function mapFileName(path?: string): string {
  const normalized = normalizeMapFilePath(path);
  return normalized.split("/").pop() ?? "";
}
