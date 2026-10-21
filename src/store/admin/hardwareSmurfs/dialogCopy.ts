import type { HolderCount } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { needsReason, type OverrideAction, type Replaced } from "./actions";
import { key, type Translate } from "./translate";

/** "N accounts hold this item"; "N+" when the server stopped counting. */
export function holdersText(holders: HolderCount, t: Translate): string {
  const named = { count: holders.count };
  if (holders.capped) return t(key("holders_capped"), named);
  return t(key(holders.count === 1 ? "holders_one" : "holders_other"), named);
}

export interface DialogContext {
  action: OverrideAction;
  replaces: Replaced | null;
  /** The account the page shows. */
  battleTag: string;
  /** Pair actions: the other account. */
  other?: string;
  /** Item actions: the selected item. */
  item?: { kind: string; hash8: string };
  /** Wide-impact actions: the holder count, null while unknown. */
  holders?: HolderCount | null;
}

export type DialogTone = "primary" | "warning" | "error";

export interface DialogCopy {
  title: string;
  body: string;
  /** Set when the action replaces the opposite override. */
  replaceNotice: string | null;
  /** The wide-impact warning (trust, ignore). */
  warning: string | null;
  holders: string | null;
  confirmLabel: string;
  tone: DialogTone;
  needsReason: boolean;
}

const TONES: Record<OverrideAction, DialogTone> = {
  "smurf": "primary",
  "revoke-smurf": "primary",
  "not-smurf": "primary",
  "revoke-not-smurf": "primary",
  "trust": "error",
  "revoke-trust": "primary",
  "ignore": "warning",
  "revoke-ignore": "primary",
};

/** The texts of the confirm dialog of one override. */
export function actionDialogCopy(context: DialogContext, t: Translate): DialogCopy {
  const { action } = context;
  const named = {
    a: context.battleTag,
    b: context.other ?? "",
    battleTag: context.battleTag,
    kind: context.item?.kind ?? "",
    hash8: context.item?.hash8 ?? "",
  };
  const warning = action === "trust" || action === "ignore" ? t(key(`warning_${action}`)) : null;
  return {
    title: t(key(`action_${action}`)),
    body: t(key(`body_${action}`), named),
    replaceNotice: context.replaces ? t(key(`replaces_${context.replaces}`)) : null,
    warning,
    holders: warning !== null && context.holders ? holdersText(context.holders, t) : null,
    confirmLabel: t(key(`action_${action}`)),
    tone: TONES[action],
    needsReason: needsReason(action),
  };
}
