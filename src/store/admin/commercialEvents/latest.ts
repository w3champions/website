/**
 * Numbers the requests of one kind so that only the newest may write its result:
 * a slower, older response must never overwrite a newer one. Stores keep their
 * sequences at module level so `$reset()` cannot rewind them.
 */
export interface RequestSequence {
  /** Starts a request and returns its number. */
  next(): number;
  /** True while no newer request has started and nothing invalidated this one. */
  isLatest(request: number): boolean;
  /** Supersedes every request started so far. */
  invalidate(): void;
}

export function requestSequence(): RequestSequence {
  let latest = 0;
  return {
    next: () => ++latest,
    isLatest: (request) => request === latest,
    invalidate: () => {
      latest++;
    },
  };
}

/** A request sequence per key, such as one per allocation id. */
export interface KeyedRequestSequence {
  next(key: string): number;
  isLatest(key: string, request: number): boolean;
  invalidate(key: string): void;
}

export function keyedRequestSequence(): KeyedRequestSequence {
  let counter = 0;
  const latest = new Map<string, number>();
  return {
    next: (key) => {
      latest.set(key, ++counter);
      return counter;
    },
    isLatest: (key, request) => latest.get(key) === request,
    invalidate: (key) => {
      latest.delete(key);
    },
  };
}
