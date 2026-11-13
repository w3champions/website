import type { SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";

type Placed = Pick<SmurfEventSummary, "id" | "from">;

/**
 * The server's queue order: `from` descending, then `id` descending. Negative when `a` comes before `b`.
 * Ids compare as text, as the server's keys do.
 */
function queueOrder(a: Placed, b: Placed): number {
  const byFrom = Date.parse(b.from) - Date.parse(a.from);
  if (byFrom !== 0 && !Number.isNaN(byFrom)) return byFrom;
  return a.id === b.id ? 0 : a.id < b.id ? 1 : -1;
}

/**
 * The unreviewed events just before and after `open` in the queue order, among the events loaded.
 * `open` is placed by its own `from` and `id`, so it need not be in the list (it may have been
 * reviewed since, filtered out, or on a page not loaded) and the list's own order does not matter.
 */
export function unreviewedNeighbours(events: readonly Pick<SmurfEventSummary, "id" | "from" | "review">[], open: Placed): { previous: string | null; next: string | null } {
  const queue = events.filter((e) => e.review === "unreviewed" && e.id !== open.id).sort(queueOrder);
  const next = queue.find((e) => queueOrder(open, e) < 0);
  const before = queue.filter((e) => queueOrder(e, open) < 0);
  return { previous: before.at(-1)?.id ?? null, next: next?.id ?? null };
}
