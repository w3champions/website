import { formatUtc } from "@/helpers/utc-dates";
import type { HardwareItemStat, HardwareLink, HardwareLinkVerdict, VerdictKind } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { key, type Translate } from "./translate";

/** The tombstone reasons the page has a plain-language label for; any other shows as "Ended". */
const TOMBSTONE_REASONS: ReadonlySet<string> = new Set(["location-veto", "venue", "rule-no-longer-met", "over-cap", "not-smurf", "verdict-revoked", "no-shared-internal"]);

export function tombstoneReasonLabel(reason: string | undefined, t: Translate): string {
  return t(key(reason !== undefined && TOMBSTONE_REASONS.has(reason) ? `reason_${reason}` : "reason_unknown"));
}

const SOURCES: ReadonlySet<string> = new Set(["account", "hardware", "legacy-machineguid", "moderator"]);

/** A link source's label; a source the page does not know shows as sent. */
export function sourceLabel(source: string, t: Translate): string {
  return SOURCES.has(source) ? t(key(`source_${source}`)) : source;
}

/** A verdict's kind (one without `kind` predates confirmed pairs: `not-smurf`); null without a verdict. */
export function verdictKindOf(verdict: HardwareLinkVerdict | undefined): VerdictKind | null {
  if (!verdict) return null;
  return verdict.kind ?? "not-smurf";
}

export function verdictLabel(kind: VerdictKind, t: Translate): string {
  return t(key(`verdict_${kind}`));
}

/** Whether the link's Discord report is pending or was delivered. */
export function reportStatusLabel(link: Pick<HardwareLink, "reportPending" | "reportedAt">, t: Translate): string {
  if (link.reportPending) return t(key("report_pending"));
  if (link.reportedAt) return t(key("report_sent"), { at: formatUtc(link.reportedAt) });
  return t(key("dash"));
}

export interface ItemFlag {
  id: "common" | "overCap" | "placeholder" | "trusted" | "ignored" | "noStat";
  label: string;
  /** Vuetify color of the chip. */
  color: string;
}

/** The flags the server set on an item, in a fixed order. Nothing is derived on the client. */
export function itemFlagLabels(item: { stat: HardwareItemStat | null; trusted?: boolean; ignored?: boolean }, t: Translate): ItemFlag[] {
  const flags: ItemFlag[] = [];
  if (item.stat === null) flags.push({ id: "noStat", label: t(key("flag_no_stat")), color: "grey" });
  if (item.stat?.common) flags.push({ id: "common", label: t(key("flag_common")), color: "grey" });
  if (item.stat?.overCap) flags.push({ id: "overCap", label: t(key("flag_over_cap")), color: "grey" });
  if (item.stat?.placeholder) flags.push({ id: "placeholder", label: t(key("flag_placeholder")), color: "grey" });
  if (item.trusted) flags.push({ id: "trusted", label: t(key("flag_trusted")), color: "error" });
  if (item.ignored) flags.push({ id: "ignored", label: t(key("flag_ignored")), color: "warning" });
  return flags;
}
