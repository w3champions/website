// `fetch` has no timeout of its own: a request the network never answers stays
// pending for as long as the tab is open. A single hung call is enough to hold a
// whole batch job open, so every call gets a budget and gives up on its own.

/** Thrown when a request did not finish within its budget. */
export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number, cause?: unknown) {
    super(message, { cause });
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export interface FetchTimeoutOptions {
  /** How long the whole exchange may take before it is given up on. */
  timeoutMs: number;
  /** What the call was doing, for the message: "Reading the maps timed out…". */
  describe: string;
  /**
   * Appended to the timeout message for calls that write. A timed-out request
   * may well have reached the server and been applied, so the caller has to be
   * told that the outcome is unknown rather than that nothing happened.
   */
  uncertainOutcome?: string;
}

export function timeoutError(options: FetchTimeoutOptions, cause?: unknown): TimeoutError {
  const seconds = Math.round(options.timeoutMs / 1000);
  const suffix = options.uncertainOutcome ? ` ${options.uncertainOutcome}` : "";
  return new TimeoutError(
    `${options.describe} timed out after ${seconds} s.${suffix}`,
    options.timeoutMs,
    cause,
  );
}

/**
 * As `fetch`, but the whole exchange - the response *and* whatever `consume`
 * reads out of it - has to finish within `timeoutMs`, and giving up surfaces as
 * a {@link TimeoutError} with a readable message rather than a bare
 * `AbortError`.
 *
 * The body is read inside the budget on purpose: headers can arrive promptly on
 * a connection that then stalls mid-body, and a `response.json()` left running
 * on its own is exactly as hung as a request that was never answered. That is
 * the likeliest shape here, because the one big response in this app is the
 * unpaged map list.
 *
 * Uses AbortController rather than `AbortSignal.timeout` so the timer is an
 * ordinary `setTimeout` that tests can drive, and so it is cleared as soon as
 * the exchange is over instead of being left to fire into nothing.
 *
 * A caller-supplied `AbortSignal` is not supported - composing one would need
 * `AbortSignal.any`, which Chrome 109 (a browserslist target here) does not
 * have. `init` excludes `signal` so that limitation is a compile error rather
 * than a silently ignored argument.
 */
export async function fetchWithTimeout<T>(
  url: string,
  init: Omit<RequestInit, "signal">,
  options: FetchTimeoutOptions,
  consume: (response: Response) => Promise<T>,
  fetchImpl: typeof globalThis.fetch = globalThis.fetch,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    return await consume(response);
  } catch (err) {
    // Only our own abort becomes a timeout; a genuine network error has to keep
    // its own meaning.
    if (controller.signal.aborted) throw timeoutError(options, err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
