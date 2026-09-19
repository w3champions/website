// A map's selected file is stored on the map as a game path ("maps\foo\bar.w3x"),
// while the file list returns storage paths ("foo/bar.w3x"). Normalizing both to a
// lower-case, forward-slashed, "maps/"-less form makes them comparable.
//
// Exactly one leading "maps/" is dropped, which is what makes toGameMapPath and
// this function each other's inverse. That holds because the update service stores
// file paths as "W3Champions/<name>" - a stored path that itself began with
// "maps/" would come back one segment short here, and reconciliation, which
// compares a stored path against a game path, depends on the round trip.
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

// The reverse of the above: turn a stored file's path into the game path a map
// carries ("W3Champions/x.w3x" -> "maps\W3Champions\x.w3x").
export function toGameMapPath(filePath: string): string {
  return `maps\\${filePath.replaceAll("/", "\\")}`;
}

// The name a picked file is claimed under, with its case kept: the upload sends
// this string and the plan reasons about it, so they must not derive it
// differently. Any folder the admin typed is dropped - the update service keeps
// every map file in one directory and would treat a slash as a path to write to.
export function toStoredFileName(storeAs: string, fallback: string): string {
  const typed = storeAs.trim().split(/[\\/]/).pop()?.trim() ?? "";
  return typed || fallback.trim();
}
