import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithTimeout, TimeoutError, timeoutError } from "./fetchWithTimeout";

const OPTIONS = { timeoutMs: 30_000, describe: "Reading the maps" };

const readJson = (response: Response): Promise<unknown> => response.json();

/** A fetch whose response never arrives, and which reports whether it was aborted. */
function unansweredFetch() {
  let aborted = false;
  const impl = vi.fn<typeof globalThis.fetch>((_url, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        aborted = true;
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    })
  );
  return { impl, wasAborted: () => aborted };
}

/**
 * A fetch that answers with headers straight away but leaves the body open, the
 * way a connection that stalls mid-response does. The stream is wired to the
 * signal exactly as a real `fetch` body is, so aborting fails the body read.
 */
function stallingBodyFetch(status = 200) {
  let aborted = false;
  let push: (chunk: string) => void = () => {};
  let finish: () => void = () => {};

  const impl = vi.fn<typeof globalThis.fetch>((_url, init) => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        push = (chunk) => controller.enqueue(new TextEncoder().encode(chunk));
        finish = () => controller.close();
        init?.signal?.addEventListener("abort", () => {
          aborted = true;
          controller.error(new DOMException("The operation was aborted.", "AbortError"));
        });
      },
    });
    return Promise.resolve(new Response(body, { status, headers: { "Content-Type": "application/json" } }));
  });

  return { impl, wasAborted: () => aborted, send: (chunk: string) => push(chunk), end: () => finish() };
}

describe("fetchWithTimeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("rejects with the budget in the message when the response never arrives", async () => {
    const { impl } = unansweredFetch();

    const pending = fetchWithTimeout("https://api.example.com/maps", { method: "GET" }, OPTIONS, readJson, impl);
    const settled = expect(pending).rejects.toThrow("Reading the maps timed out after 30 s.");
    await vi.advanceTimersByTimeAsync(30_000);

    await settled;
  });

  it("aborts the request itself, so the connection is not left open", async () => {
    const unanswered = unansweredFetch();

    const pending = fetchWithTimeout("https://api.example.com/maps", {}, OPTIONS, readJson, unanswered.impl);
    const settled = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(30_000);
    await settled;

    expect(unanswered.wasAborted()).toBe(true);
  });

  it("times out a response whose headers arrived but whose body stalls", async () => {
    // The budget covers the whole exchange. A 200 whose body never finishes is
    // as hung as a request that was never answered, and it would otherwise hold
    // the bulk upload's map reload open forever.
    const stalling = stallingBodyFetch();

    const pending = fetchWithTimeout("https://api.example.com/maps", {}, OPTIONS, readJson, stalling.impl);
    const settled = expect(pending).rejects.toThrow("Reading the maps timed out after 30 s.");
    // Some of the body arrives and then nothing more; what is in it does not
    // matter, because the read never gets as far as parsing it.
    stalling.send("a partial body");
    await vi.advanceTimersByTimeAsync(30_000);
    await settled;

    expect(stalling.wasAborted()).toBe(true);
  });

  it("times out an error body that stalls, not just a successful one", async () => {
    // Failures are reported by reading the body too, so that read needs the same
    // bound - otherwise a 500 with a stalled body hangs where a 200 would not.
    const stalling = stallingBodyFetch(500);
    const readErrorBody = async (response: Response): Promise<never> => {
      throw new Error(await response.text());
    };

    const pending = fetchWithTimeout("https://api.example.com/maps", {}, OPTIONS, readErrorBody, stalling.impl);
    const settled = expect(pending).rejects.toThrow("Reading the maps timed out after 30 s.");
    await vi.advanceTimersByTimeAsync(30_000);
    await settled;

    expect(stalling.wasAborted()).toBe(true);
  });

  it("says the outcome is unknown for a call that writes", async () => {
    const { impl } = unansweredFetch();

    const pending = fetchWithTimeout(
      "https://api.example.com/maps/1",
      { method: "PUT" },
      {
        timeoutMs: 30_000,
        describe: "Updating map 1",
        uncertainOutcome: "It may still have been applied; running this again is safe.",
      },
      readJson,
      impl,
    );
    const settled = expect(pending).rejects.toThrow(
      "Updating map 1 timed out after 30 s. It may still have been applied; running this again is safe.",
    );
    await vi.advanceTimersByTimeAsync(30_000);

    await settled;
  });

  it("throws a TimeoutError that carries the budget and the abort it came from", async () => {
    const { impl } = unansweredFetch();

    const pending = fetchWithTimeout("https://api.example.com/maps", {}, OPTIONS, readJson, impl);
    const settled = pending.catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(30_000);
    const err = await settled;

    expect(err).toBeInstanceOf(TimeoutError);
    expect((err as TimeoutError).timeoutMs).toBe(30_000);
    expect((err as TimeoutError).cause).toBeInstanceOf(DOMException);
  });

  it("returns what the body read produced and clears the timer once it is done", async () => {
    const stalling = stallingBodyFetch();

    const pending = fetchWithTimeout("https://api.example.com/maps", {}, OPTIONS, readJson, stalling.impl);
    await vi.advanceTimersByTimeAsync(29_000);
    stalling.send(JSON.stringify({ total: 2 }));
    stalling.end();
    const body = await pending;

    expect(body).toEqual({ total: 2 });
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(stalling.wasAborted()).toBe(false);
  });

  it("passes a network error through unchanged rather than calling it a timeout", async () => {
    const impl = vi.fn<typeof globalThis.fetch>(() => Promise.reject(new TypeError("Failed to fetch")));

    await expect(fetchWithTimeout("https://api.example.com/maps", {}, OPTIONS, readJson, impl))
      .rejects.toThrow("Failed to fetch");
  });

  it("passes an error thrown while reading the body through unchanged", async () => {
    const impl = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(new Response("not json", { status: 200 })));

    await expect(fetchWithTimeout("https://api.example.com/maps", {}, OPTIONS, readJson, impl))
      .rejects.not.toBeInstanceOf(TimeoutError);
  });

  it("keeps the caller's request options and adds its own signal", async () => {
    const impl = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(new Response("{}", { status: 200 })));

    await fetchWithTimeout("https://api.example.com/maps", { method: "PUT", body: "{}" }, OPTIONS, readJson, impl);

    const init = impl.mock.calls[0][1];
    expect(init).toMatchObject({ method: "PUT", body: "{}" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("timeoutError", () => {
  it("rounds the budget to whole seconds", () => {
    expect(timeoutError({ timeoutMs: 300_000, describe: "Uploading the file" }).message)
      .toBe("Uploading the file timed out after 300 s.");
  });
});
