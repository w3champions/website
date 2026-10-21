import type { HardwareLink } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { verdictKindOf } from "./labels";

export type PairAction = "smurf" | "revoke-smurf" | "not-smurf" | "revoke-not-smurf";
export type ItemAction = "trust" | "revoke-trust" | "ignore" | "revoke-ignore";
export type OverrideAction = PairAction | ItemAction;

/** The override an action replaces: a verdict kind for pairs, `trust` / `ignore` for items. */
export type Replaced = "smurf" | "not-smurf" | "trust" | "ignore";

export interface ActionOption<A extends OverrideAction = OverrideAction> {
  action: A;
  /** Set when the action replaces the opposite override (the dialog says so). */
  replaces: Replaced | null;
}

const REASON_ACTIONS: ReadonlySet<OverrideAction> = new Set<OverrideAction>(["smurf", "not-smurf", "trust", "ignore"]);
const ITEM_ACTIONS: ReadonlySet<OverrideAction> = new Set<OverrideAction>(["trust", "revoke-trust", "ignore", "revoke-ignore"]);
const WIDE_IMPACT: ReadonlySet<OverrideAction> = new Set<OverrideAction>(["trust", "ignore"]);

/** Setting an override takes a reason; a revoke takes none (the server records only its author). */
export function needsReason(action: OverrideAction): boolean {
  return REASON_ACTIONS.has(action);
}

export function isItemAction(action: OverrideAction): action is ItemAction {
  return ITEM_ACTIONS.has(action);
}

/** Trust and ignore re-check every account holding the item: the dialog shows the holder count first. */
export function isWideImpact(action: OverrideAction): boolean {
  return WIDE_IMPACT.has(action);
}

/** The verdict actions on a pair, for a moderator with SmurfCheckerAdministration (else none). */
export function pairActions(link: Pick<HardwareLink, "verdict">, canAdminister: boolean): ActionOption<PairAction>[] {
  if (!canAdminister) return [];
  switch (verdictKindOf(link.verdict)) {
    case "smurf":
      return [{ action: "revoke-smurf", replaces: null }, { action: "not-smurf", replaces: "smurf" }];
    case "not-smurf":
      return [{ action: "revoke-not-smurf", replaces: null }, { action: "smurf", replaces: "not-smurf" }];
    default:
      return [{ action: "smurf", replaces: null }, { action: "not-smurf", replaces: null }];
  }
}

/** The trust / ignore actions on an item, for a moderator with SmurfCheckerAdministration (else none). */
export function itemActions(item: { trusted: boolean; ignored: boolean }, canAdminister: boolean): ActionOption<ItemAction>[] {
  if (!canAdminister) return [];
  if (item.trusted && item.ignored) return [{ action: "revoke-trust", replaces: null }, { action: "revoke-ignore", replaces: null }];
  if (item.trusted) return [{ action: "revoke-trust", replaces: null }, { action: "ignore", replaces: "trust" }];
  if (item.ignored) return [{ action: "revoke-ignore", replaces: null }, { action: "trust", replaces: "ignore" }];
  return [{ action: "trust", replaces: null }, { action: "ignore", replaces: null }];
}
