/**
 * Orders the admin Maps page's overlapping reloads.
 *
 * The page's first load, the refresh after a save, an enable/disable or a bulk
 * selection, and the "Show temporary maps" opt-in can all be in flight at once,
 * and their responses can land in any order. Every response is the same list -
 * the maps matching the filter, with or without the temporary ones - so the
 * decisions are only about ordering, and they all live here:
 *
 * - The table only moves forward. An older response still lands while nothing
 *   newer has, but it never replaces a newer one.
 * - Only the newest load reports its failure. An older load's failure is moot:
 *   the newer load refreshes the table and reports its own outcome.
 * - `includeTemporary` describes the rows on screen. While the newest load is
 *   in flight the flag is what that load asked for; once the newest load has
 *   settled, the flag is the one the shown rows were fetched with, whichever
 *   load they came from. So a failed opt-in reverts the flag even when the
 *   failure that gets reported belongs to a later load that inherited the new
 *   flag, the opt-in's own failure having been superseded and swallowed - and
 *   whenever nothing is in flight, the flag and the rows agree.
 *
 * Nothing here is reactive: the store applies what these methods return. It is
 * a separate module so Vitest can cover it - the store cannot be imported by
 * the suites (see `mapsRequest.ts`), the same reason
 * `playerMatchTelemetry/notice.ts` sits beside its store.
 */

export interface ReloadLanded {
  /** Whether these rows replace the table's; false when a newer response got there first. */
  apply: boolean;
  /** What `includeTemporary` must be once this response is handled. */
  includeTemporary: boolean;
}

export interface ReloadFailed {
  /** Whether the caller should report the failure; false when a newer load reports instead. */
  report: boolean;
  /** What `includeTemporary` must be once this failure is handled. */
  includeTemporary: boolean;
}

export class ReloadSequence {
  private latest = 0;
  private shown = 0;
  private shownFlag: boolean;
  /** The flag each unsettled load was fetched with, by id. */
  private readonly inFlight = new Map<number, boolean>();
  /** What `reset()` rewinds `shownFlag` to - the table an empty page counts as showing. */
  private readonly initialIncludeTemporary: boolean;

  /** `initialIncludeTemporary` is what an empty table counts as showing. */
  constructor(initialIncludeTemporary = false) {
    this.initialIncludeTemporary = initialIncludeTemporary;
    this.shownFlag = initialIncludeTemporary;
  }

  /**
   * Forgets every load that is still in flight and rewinds the shown flag to
   * its initial value, so a response from the old session that lands later
   * can neither replace the table nor report a failure: `settle` returns
   * `undefined` for an id this no longer recognises, which makes `apply`
   * false in `landed` and `report` false in `failed`.
   *
   * That holds only because `latest` is deliberately *not* rewound: ids stay
   * monotonic for the sequence's whole lifetime, so a forgotten id can never
   * match one handed out later and a stale response can never be mistaken for
   * the load that reopened the page. Zeroing the counter here would hand the
   * next load an id the forgotten one is still waiting on, and its late
   * response would consume that entry - repainting the table with the old
   * page's rows, or swallowing the new page's own failure. `shown` is still
   * rewound, and safely: every id issued from now on is greater than 0, so
   * the first load after a reset applies.
   */
  reset(): void {
    this.inFlight.clear();
    this.shown = 0;
    this.shownFlag = this.initialIncludeTemporary;
  }

  /** Registers a load fetched with `includeTemporary` and returns its id. */
  start(includeTemporary: boolean): number {
    const id = ++this.latest;
    this.inFlight.set(id, includeTemporary);
    return id;
  }

  landed(id: number): ReloadLanded {
    const flag = this.settle(id);
    // No flag: never started, or already settled - there is nothing to show.
    const apply = flag !== undefined && id > this.shown;
    if (apply) {
      this.shown = id;
      this.shownFlag = flag;
    }
    return { apply, includeTemporary: this.currentFlag() };
  }

  failed(id: number): ReloadFailed {
    const flag = this.settle(id);
    const report = flag !== undefined && id === this.latest;
    return { report, includeTemporary: this.currentFlag() };
  }

  /**
   * Whether the rows on screen came from a load no older than `id` - that is,
   * whether `id`'s caller may read the table as the result of a completed load
   * of its own, or of a later one. Ask it once `landed`/`failed` has settled
   * the load.
   *
   * It exists because "the load resolved" is not "the maps are fresh": a load
   * whose own request failed while a newer one was in flight resolves silently,
   * the newer load having taken over reporting, and the table is then still
   * showing what it showed before. A caller that *reads* the rows rather than
   * just repainting them - the bulk upload run builds each map update from the
   * map as it reads right now - has to be able to tell that apart from a read
   * of its own. This only reports on the ordering above; it decides nothing.
   */
  showsRowsNoOlderThan(id: number): boolean {
    return this.shown >= id;
  }

  /** The newest load's flag while it is in flight, else the shown rows'. */
  private currentFlag(): boolean {
    return this.inFlight.get(this.latest) ?? this.shownFlag;
  }

  private settle(id: number): boolean | undefined {
    const flag = this.inFlight.get(id);
    this.inFlight.delete(id);
    return flag;
  }
}
