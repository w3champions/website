/**
 * Numbers the requests of one kind so that only the newest may write its result:
 * a slower, older response must never overwrite a newer one. Stores keep their
 * sequences at module level so `$reset()` cannot rewind them.
 *
 * The admin stores follow four rules with it:
 * - every load runs through {@link loadLatest};
 * - a write applied locally supersedes a load still in flight with a fresh one
 *   (the stores' `supersedePendingLoad`), so the older answer cannot undo it;
 * - `clear()` invalidates every sequence of the store, so nothing started before
 *   a navigation writes into the next visit — even a visit to the same id;
 * - work that is not a load but must not outlive its visit (a write's follow-up,
 *   a lookup that navigates) captures {@link RequestSequence.current} of a visit
 *   sequence and checks it with `isLatest` once it settles.
 */
export interface RequestSequence {
  /** Starts a request and returns its number. */
  next(): number;
  /** True while no newer request has started and nothing invalidated this one. */
  isLatest(request: number): boolean;
  /** Supersedes every request started so far. */
  invalidate(): void;
  /** The newest number without starting a request: a token that stays latest until the next `next()` or `invalidate()`. */
  current(): number;
}

export function requestSequence(): RequestSequence {
  let latest = 0;
  return {
    next: () => ++latest,
    isLatest: (request) => request === latest,
    invalidate: () => {
      latest++;
    },
    current: () => latest,
  };
}

/** One load for {@link loadLatest}. */
export interface LatestLoad<T> {
  /** Named in the console message of a failure, e.g. "allocations". */
  what: string;
  setLoading(loading: boolean): void;
  fetch(): Promise<T>;
  apply(result: T): void;
  fail(e: unknown): void;
}

// Per sequence, the outcome of its newest load: a superseded load resolves with that one's.
const newestOutcome = new WeakMap<object, Promise<boolean>>();

/**
 * Runs one latest-only load under `sequence`: sets `loading`, then lets `apply`
 * (or `fail`) write and clears `loading` only while this is still the newest
 * request. Every failure is logged. Resolves to whether the data now shown came
 * from a successful request: a load superseded by a newer one waits for that one
 * and resolves with its outcome, so a caller never sees "done" while the newest
 * load is still pending. A load superseded by `invalidate()` resolves with its
 * own outcome, unless a newer load started before it settled.
 */
export function loadLatest<T>(sequence: Pick<RequestSequence, "next" | "isLatest">, load: LatestLoad<T>): Promise<boolean> {
  const outcome: Promise<boolean> = runLoad(sequence, load).then(async (succeeded) => {
    const newest = newestOutcome.get(sequence);
    return newest !== undefined && newest !== outcome ? await newest : succeeded;
  });
  newestOutcome.set(sequence, outcome);
  return outcome;
}

async function runLoad<T>(sequence: Pick<RequestSequence, "next" | "isLatest">, load: LatestLoad<T>): Promise<boolean> {
  const request = sequence.next();
  load.setLoading(true);
  try {
    const result = await load.fetch();
    if (sequence.isLatest(request)) load.apply(result);
    return true;
  } catch (e) {
    console.error(`Failed to load ${load.what}:`, e);
    if (sequence.isLatest(request)) load.fail(e);
    return false;
  } finally {
    if (sequence.isLatest(request)) load.setLoading(false);
  }
}

/** A request sequence per key, such as one per allocation id. */
export interface KeyedRequestSequence {
  next(key: string): number;
  isLatest(key: string, request: number): boolean;
  invalidate(key: string): void;
  /** Supersedes the requests of every key. */
  clear(): void;
  /** The sequence of one key, for {@link loadLatest}. */
  forKey(key: string): Pick<RequestSequence, "next" | "isLatest">;
}

export function keyedRequestSequence(): KeyedRequestSequence {
  let counter = 0;
  const latest = new Map<string, number>();
  // One view per key, so loadLatest can follow a key's newest load.
  const views = new Map<string, Pick<RequestSequence, "next" | "isLatest">>();
  return {
    next: (key) => {
      latest.set(key, ++counter);
      return counter;
    },
    isLatest: (key, request) => latest.get(key) === request,
    invalidate: (key) => {
      latest.delete(key);
    },
    clear: () => {
      latest.clear();
    },
    forKey(key) {
      let view = views.get(key);
      if (view === undefined) {
        view = { next: () => this.next(key), isLatest: (request) => this.isLatest(key, request) };
        views.set(key, view);
      }
      return view;
    },
  };
}
