import type { OverrideResult } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { verdictLabel } from "./labels";
import { key, type Translate } from "./translate";

/**
 * What the server answered to an override, line by line: its message, then the outcome fields
 * it set. The links change only once the re-check ran, so this is never shown as the new state.
 */
export function actionResultLines(result: OverrideResult, t: Translate): string[] {
  const lines = [result.message];
  if (typeof result.outcome === "string") lines.push(t(key("result_outcome"), { outcome: result.outcome }));
  if (result.replaced === "smurf" || result.replaced === "not-smurf") lines.push(t(key("result_replaced"), { verdict: verdictLabel(result.replaced, t) }));
  if (result.repaired === true) lines.push(t(key("result_repaired")));
  if (typeof result.trustRemoved === "number" && result.trustRemoved > 0) lines.push(t(key("result_trust_removed")));
  if (typeof result.ignoreRemoved === "number" && result.ignoreRemoved > 0) lines.push(t(key("result_ignore_removed")));
  if (typeof result.queued === "number" && result.queued > 0) lines.push(t(key("result_queued"), { count: result.queued }));
  return lines.filter((line) => typeof line === "string" && line !== "");
}
