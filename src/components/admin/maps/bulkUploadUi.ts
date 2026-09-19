import type { BulkPlanCandidate } from "./bulkUploadPlan";
import type { Map } from "@/store/admin/mapsManagement/types";

// The glue between the bulk upload dialog and the two modules that do the work.
// It lives outside the component because every mistake this feature has made so
// far was in the glue: which rows the planner is shown, what the run is summed up
// as, and what the admin is allowed to press while it runs.

/** What has happened to a picked file so far. */
export type BulkRowState = "pending" | "uploading" | "uploaded" | "selected" | "failed";

/** What a row is showing right now, which is its state plus what the plan makes of it. */
export type BulkRowStatus =
  | "preparing"
  | "ready"
  | "reuse"
  | "duplicate"
  | "skipped"
  | "uploading"
  | "uploaded"
  | "selected"
  | "error";

/** Which button is running, or null when the dialog is idle. */
export type RunAction = "upload" | "upload-select" | "select" | null;

export interface PlanRowInput {
  key: string;
  fileName: string;
  storeAs: string;
  mapId: number | null;
  mapExists: boolean;
  /** The id names a map that exists but is temporary, so it cannot take a file. */
  mapTemporary?: boolean;
  sha1: string | null;
  state: BulkRowState;
}

/**
 * Chooses what the planner is allowed to see.
 *
 * A row that is on its way still holds its name, so its identical copies stay
 * duplicates rather than turning back into things to upload. A row that failed is
 * left out, so one of its copies can take its place on the next attempt instead of
 * the map ending up with no file at all.
 */
export function toPlanCandidates(rows: PlanRowInput[]): BulkPlanCandidate[] {
  return rows
    .filter((row) => row.state !== "failed")
    .map((row) => ({
      key: row.key,
      fileName: row.fileName,
      storeAs: row.storeAs,
      mapId: row.mapId,
      mapExists: row.mapExists,
      mapTemporary: row.mapTemporary,
      sha1: row.sha1,
      settled: row.state !== "pending",
    }));
}

/**
 * The maps a run may build its updates from, or a throw.
 *
 * A reload resolving is not the same as the maps being fresh: a load whose own
 * request failed while a newer one was in flight resolves silently, because the
 * newer load reports instead, and the rows from before the run are then still
 * the ones in the store. `selectMapFiles` builds every update from the map as it
 * reads right now, so taking those rows would either revert a concurrent edit or
 * report every row as unverified against pre-update rows - both silently. A
 * throw puts the run on the "the maps could not be read" branch it already has.
 */
export function freshMapsOrThrow(showsFreshRows: boolean, maps: Map[]): Map[] {
  if (!showsFreshRows) throw new Error("the maps on screen are not the ones this reload read");
  return maps;
}

export interface RunTally {
  /** Files in the batch when the run started. */
  total: number;
  /** Files the plan refused to send. */
  blocked: number;
  /** Files with no map of their own. */
  skipped: number;
  /** Identical copies of a file that is being handled once. */
  duplicates: number;
  succeeded: number;
  failed: number;
  /** What the run did, in the order the phases ran. */
  headlines: string[];
  /** What to do next, shown only when the run was clean. */
  hint: string;
  /**
   * Whether this run is one the parent should hear about. Only a run that pointed
   * maps at their files is; uploading alone changes no map.
   */
  notifiesParent?: boolean;
  /** Why the run stopped, when it stopped rather than finished. */
  fatal?: string;
}

export interface TallyRowInput {
  key: string;
  status: BulkRowStatus;
}

/**
 * What the batch looks like the moment a run starts.
 *
 * The summary is built from this plus the run's own results, never from the live
 * rows: a Reset or a re-pick part-way through must not be able to turn a failed
 * run into a success banner.
 *
 * Only the rows this run is leaving alone are counted. A row the run is about to
 * act on is this run's to report, whatever the last one left it looking like -
 * otherwise a retry of a failed row would be held against it as well as counted
 * again when it fails, and could never be reported as fixed when it succeeds.
 */
export function startTally(rows: TallyRowInput[], acting: Iterable<string>): RunTally {
  const actingKeys = new Set(acting);
  const heldBack = rows.filter((row) => !actingKeys.has(row.key)).map((row) => row.status);

  return {
    total: rows.length,
    blocked: heldBack.filter((status) => status === "error").length,
    skipped: heldBack.filter((status) => status === "skipped").length,
    duplicates: heldBack.filter((status) => status === "duplicate").length,
    succeeded: 0,
    failed: 0,
    headlines: [],
    hint: "",
  };
}

export interface RunSummary {
  error: string;
  successMessage: string;
  /** Whether the parent may be told the run finished. */
  mayComplete: boolean;
}

/**
 * Sums a run up from its own results rather than from the rows, so nothing that
 * happens afterwards - a Reset, a re-pick - can turn a failed run into a success.
 */
export function summarizeRun(tally: RunTally): RunSummary {
  const problems = tally.failed + tally.blocked;
  const done = tally.headlines.filter(Boolean).join(" ");

  if (problems > 0) {
    const scope = Math.max(tally.total, problems + tally.succeeded);
    return {
      successMessage: "",
      // The reason comes first and is never dropped: a count on its own leaves
      // nothing to act on, and the rows it points at may carry no message either.
      error: [
        tally.fatal,
        done,
        `${problems} of ${scope} file${problems === 1 ? "" : "s"} need attention and were not applied.`,
        "See the rows below.",
      ].filter(Boolean).join(" "),
      mayComplete: false,
    };
  }

  if (tally.fatal) {
    return { error: tally.fatal, successMessage: "", mayComplete: false };
  }

  // Everything held back is named too, so nothing that did not happen is missing
  // from the headline.
  const parts = [done];
  if (tally.duplicates > 0) {
    parts.push(`${tally.duplicates} identical ${tally.duplicates === 1 ? "copy" : "copies"} skipped`);
  }
  if (tally.skipped > 0) parts.push(`${tally.skipped} skipped`);

  return {
    error: "",
    successMessage: [parts.filter(Boolean).join(" · "), tally.hint].filter(Boolean).join(" "),
    mayComplete: tally.succeeded > 0 && tally.notifiesParent === true,
  };
}

export interface GatingInput {
  runningAction: RunAction;
  preparing: boolean;
}

export interface Gating {
  /** The actions and the drop zone are held back. */
  busy: boolean;
  canReset: boolean;
  canClose: boolean;
}

/**
 * What the admin may press.
 *
 * Reset and Close are tied to the whole run, not to the request that happens to be
 * in flight: a run keeps going through phases where nothing is on screen (the
 * refresh after the uploads, the verification after the updates), and closing the
 * dialog unmounts the component while those phases are still firing writes.
 * During the pre-flight check nothing has been written yet, so both stay usable.
 */
export function gatingFor({ runningAction, preparing }: GatingInput): Gating {
  const running = runningAction !== null;
  return {
    busy: running || preparing,
    canReset: !running,
    canClose: !running,
  };
}
