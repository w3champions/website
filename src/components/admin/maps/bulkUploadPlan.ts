import type { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { isSameMapFile, mapFileName, toStoredFileName } from "./mapFilePath";

// The update service never replaces a stored map file: a second POST under a
// name it already holds fails with "File already exists". Deciding up front what
// each picked file should do - upload, reuse what is already there, skip an
// identical copy, or refuse - keeps that error out of the legitimate cases and
// keeps the decision testable without a browser.

export type BulkPlanAction =
  // POST the bytes, then point the map at the new record.
  | "upload"
  // The identical file is already stored: point the map at it, no POST.
  | "reuse"
  // Another picked file holds the same bytes under the same name.
  | "duplicate"
  // Not ours to upload (no map id in the name, or no map in the list takes it).
  | "skip"
  // Uploading would either fail or overwrite something it should not.
  | "error"
  // Already handled in this run; what happened to it is the caller's to report.
  | "settled";

export interface BulkPlanCandidate {
  /** Unique per picked file, so two files with the same name never share a row. */
  key: string;
  /** The picked file's own name, for messages. */
  fileName: string;
  /** The name the file would be stored under. */
  storeAs: string;
  mapId: number | null;
  mapExists: boolean;
  /**
   * The named map exists but is temporary (self-provided), so it is not a target:
   * its file belongs to the uploader and the matchmaking service rejects
   * PUT api/maps/:id for it. Callers leave `mapExists` false for such a row - it
   * is fixable in the same way an unknown id is - and set this so the row is told
   * which of the two it is.
   *
   * A caller can only set it for a temporary map it can see: the admin Maps page
   * leaves temporary maps out of the list unless "Show temporary maps" is ticked,
   * so the usual case is a temporary map that reads as an unknown id. That is why
   * the `mapExists` message below does not claim the map is missing.
   */
  mapTemporary?: boolean;
  /** Hex SHA-1 of the whole file, or null when it could not be computed. */
  sha1: string | null;
  /**
   * True once this file has been dealt with in the current run. It keeps holding
   * its name, so its identical copies stay duplicates, but nothing is decided for
   * it any more. A file that failed should be left out of the candidates instead,
   * so one of its copies can take over.
   */
  settled?: boolean;
}

export interface BulkPlanEntry {
  key: string;
  action: BulkPlanAction;
  message?: string;
  /** Set for "reuse": the stored record the map is pointed at without uploading. */
  reuseMapFile?: MapFileData;
  /** Set for "duplicate": the key of the row that handles the identical bytes. */
  duplicateOf?: string;
}

/** A map's already stored files, or null when that lookup failed. */
export type StoredMapFilesByMapId = Record<number, MapFileData[] | null | undefined>;

export interface MapUpdateExpectation {
  /** The storage path of the file the map was pointed at. */
  filePath: string;
  sha1?: string | null;
}

export function planBulkUpload(
  candidates: BulkPlanCandidate[],
  storedByMapId: StoredMapFilesByMapId,
): BulkPlanEntry[] {
  const entries: Record<string, BulkPlanEntry> = {};
  // Grouped by the stored name alone, not by name and map: the update service
  // keeps every map file in one flat directory, so a name is claimed globally.
  const byStoredName: Record<string, BulkPlanCandidate[]> = {};

  for (const candidate of candidates) {
    // A settled file is only here to keep holding its name; nothing is decided
    // for it, so the pre-flight checks would only take it out of its group.
    const outcome = candidate.settled ? null : rejectUpfront(candidate);
    if (outcome) {
      entries[candidate.key] = outcome;
      continue;
    }

    const name = storedNameOf(candidate);
    byStoredName[name] = [...(byStoredName[name] ?? []), candidate];
  }

  for (const [name, group] of Object.entries(byStoredName)) {
    const entry = planGroup(name, group, storedByMapId);
    for (const [key, value] of Object.entries(entry)) entries[key] = value;
  }

  return candidates.map((candidate) => entries[candidate.key]);
}

function rejectUpfront(candidate: BulkPlanCandidate): BulkPlanEntry | null {
  if (candidate.mapId === null) {
    return skipped(candidate, "The file name does not start with a map id, so it was left out of this run.");
  }
  if (candidate.mapTemporary) {
    return skipped(candidate, `Map ${candidate.mapId} is a temporary map; its file belongs to the uploader.`);
  }
  if (!candidate.mapExists) {
    // Not "does not exist": the id may well name a temporary map that the maps
    // list is simply not showing (see `mapTemporary`), and sending the admin
    // looking for a map that is there is exactly what this run must not do.
    return skipped(
      candidate,
      `Map with ID ${candidate.mapId} is not in the maps list (it may not exist, or it may be a temporary map), so it was left out of this run.`,
    );
  }
  if (!storedNameOf(candidate)) {
    return failed(candidate, "A name to store the file under is required.");
  }
  if (!candidate.sha1) {
    return failed(candidate, "The file could not be read, so it cannot be compared with what is already stored.");
  }
  return null;
}

function planGroup(
  name: string,
  group: BulkPlanCandidate[],
  storedByMapId: StoredMapFilesByMapId,
): Record<string, BulkPlanEntry> {
  // A file that has already been dealt with in this run holds its name but takes
  // no new verdict: its row says what happened to it.
  const entries: Record<string, BulkPlanEntry> = {};
  for (const candidate of group) {
    if (candidate.settled) entries[candidate.key] = { key: candidate.key, action: "settled" };
  }

  const open = group.filter((candidate) => !candidate.settled);
  if (open.length === 0) return entries;

  const mapIds = [...new Set(group.map((candidate) => candidate.mapId as number))].sort((a, b) => a - b);
  const digests = [...new Set(group.map((candidate) => (candidate.sha1 ?? "").toLowerCase()))];

  if (mapIds.length > 1 || digests.length > 1) {
    // Only the files that have not been sent yet can still be renamed, so only
    // they are rejected - and the reason has to name the right obstacle.
    let message: string;
    if (open.length < group.length) {
      message = `A file already handled in this run is stored as "${name}". Map files share one directory, so rename this one.`;
    } else if (mapIds.length > 1) {
      message = `Files for maps ${mapIds.join(", ")} would all be stored as "${name}". Map files share one directory, so rename all but one.`;
    } else {
      message = `${group.length} picked files would be stored as "${name}" but their contents differ. None of them were uploaded.`;
    }

    for (const candidate of open) entries[candidate.key] = failed(candidate, message);
    return entries;
  }

  const [leader, ...copies] = group;
  const leaderEntry: BulkPlanEntry = leader.settled
    ? entries[leader.key]
    : planLeader(leader, name, storedByMapId[leader.mapId as number]);
  entries[leader.key] = leaderEntry;

  for (const copy of copies) {
    if (copy.settled) continue;
    entries[copy.key] = leaderEntry.action === "error"
      ? failed(copy, leaderEntry.message)
      : {
        key: copy.key,
        action: "duplicate",
        duplicateOf: leader.key,
        message: leaderEntry.action === "upload"
          ? `Identical to "${leader.fileName}", which is the copy being uploaded for this map, so this one was skipped.`
          : `Identical to "${leader.fileName}", which already covers this map, so this copy was skipped.`,
      };
  }
  return entries;
}

function planLeader(
  candidate: BulkPlanCandidate,
  name: string,
  stored: MapFileData[] | null | undefined,
): BulkPlanEntry {
  if (!stored) {
    return failed(candidate, "The files already stored for this map could not be read, so nothing was uploaded for it.");
  }

  // Only this map's files can be checked: the read endpoint lists per map id,
  // while the storage directory is shared. A name already claimed by a *different*
  // map therefore still surfaces as a rejected upload rather than a planned error.
  const match = stored.find((file) => mapFileName(file.filePath) === name);
  if (!match) return { key: candidate.key, action: "upload" };

  const storedSha1 = match.metaData?.sha1?.trim().toLowerCase();
  if (!storedSha1) {
    return failed(
      candidate,
      `A file named "${name}" is already stored for this map but carries no checksum, so it cannot be told apart from this one.`,
    );
  }
  if (storedSha1 !== (candidate.sha1 as string).toLowerCase()) {
    return failed(
      candidate,
      `A different file named "${name}" is already stored for this map. Stored files are never replaced, so rename this one.`,
    );
  }

  return {
    key: candidate.key,
    action: "reuse",
    reuseMapFile: match,
    message: "The identical file is already stored; the map is pointed at it without uploading again.",
  };
}

/**
 * Compares what the map was just pointed at with what it actually reads back as.
 * Returns null when they agree, otherwise the reason they do not.
 */
export function reconcileMapUpdate(expected: MapUpdateExpectation, persisted?: Map): string | null {
  if (!persisted) {
    return "The map was not in the reloaded list, so the update could not be verified.";
  }

  const persistedPath = persisted.gameMap?.path;
  if (!isSameMapFile(expected.filePath, persistedPath)) {
    return `The map still points at ${persistedPath ? `"${persistedPath}"` : "no file"} instead of "${expected.filePath}".`;
  }

  // Only checkable when the file that was selected had a checksum of its own;
  // when it did, the map has to read back with it, blank included - a dropped
  // checksum means the update did not land the way it was sent.
  const expectedSha1 = expected.sha1?.trim().toLowerCase();
  const persistedSha1 = persisted.gameMap?.sha1?.trim().toLowerCase();
  if (expectedSha1 && expectedSha1 !== persistedSha1) {
    return `The map points at the right file but its stored checksum is ${persistedSha1 || "missing"} instead of ${expectedSha1}.`;
  }

  return null;
}

// The name the update service will file this under, in the comparable form. It
// goes through the same helper the upload uses, so the plan cannot reason about a
// different name than the one that is claimed.
function storedNameOf(candidate: Pick<BulkPlanCandidate, "storeAs" | "fileName">): string {
  return mapFileName(toStoredFileName(candidate.storeAs, candidate.fileName));
}

function skipped(candidate: BulkPlanCandidate, message: string): BulkPlanEntry {
  return { key: candidate.key, action: "skip", message };
}

function failed(candidate: BulkPlanCandidate, message?: string): BulkPlanEntry {
  return { key: candidate.key, action: "error", message };
}
