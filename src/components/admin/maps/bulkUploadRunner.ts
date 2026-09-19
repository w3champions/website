import type { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { mapFileName, toGameMapPath } from "./mapFilePath";
import { reconcileMapUpdate } from "./bulkUploadPlan";
import { withSelectedMapFile } from "./mapPayload";

// Runs the plan from bulkUploadPlan.ts against the API. The calls it makes are
// injected so the outcome of a batch - which row failed, which row was never
// verified - can be tested without a browser or a backend.

export interface BulkUploadItem {
  key: string;
  mapId: number;
  /** The picked file's own name, sent as the multipart file name. */
  fileName: string;
  /** The name the file is stored under. */
  storeAs: string;
  sha1: string;
  file: Blob;
  /** Set when the plan found the identical file already stored: no POST is sent. */
  reuseMapFile?: MapFileData;
}

export interface BulkUploadDeps {
  uploadFile(item: BulkUploadItem, onProgress: (percent: number) => void): Promise<MapFileData | null>;
  fetchMapFiles(mapId: number): Promise<MapFileData[]>;
}

export interface BulkUploadHooks {
  onStart?(item: BulkUploadItem, index: number): void;
  onProgress?(item: BulkUploadItem, percent: number): void;
}

export interface BulkUploadResult {
  key: string;
  ok: boolean;
  reused: boolean;
  mapFile?: MapFileData;
  message?: string;
}

/**
 * Uploads one file at a time - batches are small, and a single request in flight
 * keeps the progress readable and cannot have two same-named files race.
 */
export async function uploadMapFiles(
  items: BulkUploadItem[],
  deps: BulkUploadDeps,
  hooks: BulkUploadHooks = {},
): Promise<BulkUploadResult[]> {
  const results: BulkUploadResult[] = [];

  for (const [index, item] of items.entries()) {
    hooks.onStart?.(item, index);

    if (item.reuseMapFile) {
      results.push({ key: item.key, ok: true, reused: true, mapFile: item.reuseMapFile });
      continue;
    }

    let created: MapFileData | null;
    try {
      created = await deps.uploadFile(item, (percent) => hooks.onProgress?.(item, percent));
    } catch (err) {
      results.push({ key: item.key, ok: false, reused: false, message: reasonFor(err, "The file could not be uploaded.") });
      continue;
    }

    // Older backends answered the upload without the record; fall back to the
    // map's file list in that case.
    let mapFile = created;
    if (!mapFile) {
      try {
        const files = await deps.fetchMapFiles(item.mapId);
        mapFile = files.find((file) => mapFileName(file.filePath) === mapFileName(item.storeAs)) ?? null;
      } catch (err) {
        results.push({
          key: item.key,
          ok: false,
          reused: false,
          message: `The file was uploaded but the map's stored files could not be re-read: ${reasonFor(err, "unknown error")}`,
        });
        continue;
      }
    }

    if (!mapFile) {
      results.push({
        key: item.key,
        ok: false,
        reused: false,
        message: `The file was uploaded but "${item.storeAs}" is not among the map's stored files.`,
      });
      continue;
    }

    // The record is matched by name, so check that it really is this file before
    // the map is pointed at it: a namesake stored by someone else would otherwise
    // be selected and would then verify against itself.
    const storedSha1 = mapFile.metaData?.sha1?.trim().toLowerCase();
    if (storedSha1 !== item.sha1.trim().toLowerCase()) {
      results.push({
        key: item.key,
        ok: false,
        reused: false,
        message: `The record stored as "${item.storeAs}" has the checksum ${storedSha1 || "missing"}, not ${item.sha1.toLowerCase()} as the picked file does.`,
      });
      continue;
    }

    results.push({ key: item.key, ok: true, reused: false, mapFile });
  }

  return results;
}

export type UploadReconciliationOutcome =
  // The stored files hold this exact file: the upload landed, the answer did not.
  | "confirmed"
  // Nothing of this name is stored, so sending it again is the right move.
  | "retry"
  // A namesake that is not this file, or a list that could not be read: neither
  // sending it again nor selecting what is there would be right.
  | "blocked";

export interface UploadReconciliation {
  outcome: UploadReconciliationOutcome;
  /** The stored record this row turned out to be, for "confirmed". */
  mapFile?: MapFileData;
  message: string;
}

/**
 * What a failed upload really did, read back from the map's stored files.
 *
 * A timed-out POST may have been applied, so "the request failed" is not an
 * answer on its own - and a row left as a bare failure is a dead end: the
 * planner is not shown failed rows and "Select uploaded" needs a record, so
 * neither button can act on it. Deciding from the re-read list is what turns it
 * back into something the admin can finish.
 *
 * Identity is the checksum, never the name: a namesake may be a file another
 * admin stored while this batch was running, in which case the upload was
 * rejected and pointing the map at that file would be wrong.
 */
export function reconcileFailedUpload(
  item: Pick<BulkUploadItem, "storeAs" | "sha1">,
  stored: MapFileData[] | null | undefined,
): UploadReconciliation {
  const name = mapFileName(item.storeAs);

  if (!stored) {
    return {
      outcome: "blocked",
      message: "The map's stored files could not be re-read, so whether this file was stored is unknown.",
    };
  }

  const match = stored.find((file) => mapFileName(file.filePath) === name);
  if (!match) {
    return { outcome: "retry", message: `Nothing is stored as "${item.storeAs}", so this file can be sent again.` };
  }

  const storedSha1 = match.metaData?.sha1?.trim().toLowerCase();
  if (!storedSha1) {
    return {
      outcome: "blocked",
      message: `A file named "${item.storeAs}" is stored for this map but carries no checksum, `
        + "so it cannot be told apart from this one.",
    };
  }

  if (storedSha1 !== item.sha1.trim().toLowerCase()) {
    return {
      outcome: "blocked",
      message: `A different file named "${item.storeAs}" is stored for this map. `
        + "Stored files are never replaced, so rename this one.",
    };
  }

  return {
    outcome: "confirmed",
    mapFile: match,
    message: "The upload was confirmed from the map's stored files; it can be selected.",
  };
}

export interface BulkSelectItem {
  key: string;
  mapId: number;
  mapFile: MapFileData;
}

export interface BulkSelectDeps {
  updateMap(map: Map): Promise<void>;
  /**
   * Reads the maps and returns them. Called twice: once to build the updates from
   * the maps as they are now, and once afterwards to check that they took.
   */
  reloadMaps(): Promise<Map[]>;
}

export interface BulkSelectHooks {
  onStart?(item: BulkSelectItem, index: number): void;
}

export interface BulkSelectResult {
  key: string;
  ok: boolean;
  /** The game path the map was pointed at. */
  gameMapPath?: string;
  message?: string;
}

/**
 * Points each map at its uploaded file, then reads the maps back and checks that
 * the change is actually there - a PUT that answers 200 without taking effect is
 * otherwise indistinguishable from one that worked.
 *
 * The update replaces the whole map document, so each update is built from the
 * map as it reads right now rather than from whatever was on screen when the
 * files were picked; a long batch would otherwise revert edits another admin made
 * while it was running.
 */
export async function selectMapFiles(
  items: BulkSelectItem[],
  deps: BulkSelectDeps,
  hooks: BulkSelectHooks = {},
): Promise<BulkSelectResult[]> {
  const results: BulkSelectResult[] = [];
  const expectations: { key: string; mapId: number; filePath: string; sha1?: string | null }[] = [];

  let current: Map[];
  try {
    current = await deps.reloadMaps();
  } catch (err) {
    const reason = reasonFor(err, "unknown error");
    return items.map((item) => ({
      key: item.key,
      ok: false,
      message: `The maps could not be read, so nothing was updated: ${reason}`,
    }));
  }

  for (const [index, item] of items.entries()) {
    hooks.onStart?.(item, index);

    const map = current.find((candidate) => candidate.id === item.mapId);
    if (!map) {
      results.push({ key: item.key, ok: false, message: `Map ${item.mapId} no longer exists, so it was not updated.` });
      continue;
    }

    const gameMapPath = toGameMapPath(item.mapFile.filePath);
    try {
      // Same builder the single-map editor uses, so there is one place that
      // decides what a "point this map at this file" update looks like.
      await deps.updateMap(withSelectedMapFile(map, item.mapFile));
      results.push({ key: item.key, ok: true, gameMapPath });
      expectations.push({
        key: item.key,
        mapId: item.mapId,
        filePath: item.mapFile.filePath,
        sha1: item.mapFile.metaData?.sha1,
      });
    } catch (err) {
      results.push({ key: item.key, ok: false, message: reasonFor(err, "The map could not be pointed at the uploaded file.") });
    }
  }

  if (expectations.length === 0) return results;

  let persisted: Map[];
  try {
    persisted = await deps.reloadMaps();
  } catch (err) {
    const reason = reasonFor(err, "unknown error");
    for (const result of results) {
      if (!result.ok) continue;
      result.ok = false;
      result.message = `The map was updated but the maps could not be re-read to verify it: ${reason}`;
    }
    return results;
  }

  // Two files aimed at one map is allowed: the last one selected is the one that
  // stays active. Check that one, and only call an earlier row superseded once
  // the later one is confirmed to have landed.
  const lastKeyByMapId: Record<number, string> = {};
  for (const expectation of expectations) lastKeyByMapId[expectation.mapId] = expectation.key;

  const mapOf = (mapId: number): Map | undefined => persisted.find((map) => map.id === mapId);
  const mismatchByMapId: Record<number, string | null> = {};
  for (const expectation of expectations) {
    if (lastKeyByMapId[expectation.mapId] !== expectation.key) continue;
    mismatchByMapId[expectation.mapId] = reconcileMapUpdate(expectation, mapOf(expectation.mapId));
  }

  for (const expectation of expectations) {
    const result = results.find((candidate) => candidate.key === expectation.key);
    if (!result) continue;

    const winnerMismatch = mismatchByMapId[expectation.mapId];
    if (lastKeyByMapId[expectation.mapId] === expectation.key) {
      if (!winnerMismatch) continue;
      result.ok = false;
      result.message = winnerMismatch;
      continue;
    }

    if (!winnerMismatch) {
      result.message = `Another file in this batch was selected for map ${expectation.mapId} afterwards, so that one is the active file.`;
      continue;
    }

    // The file that was meant to supersede this one did not land, so this row
    // has to stand on its own.
    const mismatch = reconcileMapUpdate(expectation, mapOf(expectation.mapId));
    if (!mismatch) continue;
    result.ok = false;
    result.message = mismatch;
  }

  return results;
}

function reasonFor(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
