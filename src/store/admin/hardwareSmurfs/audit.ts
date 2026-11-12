import type { AuditEntry, AuditPage, AuditTarget } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { reviewLabel } from "@/store/admin/smurfEvents/labels";
import { key, textOr, type Translate } from "./translate";

/** Outcome fields that are internal bookkeeping, never shown. */
const HIDDEN_OUTCOME_FIELDS: ReadonlySet<string> = new Set(["version"]);
/** Outcome fields holding an event review state: shown in the words of the smurf events page. */
const REVIEW_OUTCOME_FIELDS: ReadonlySet<string> = new Set(["review", "previous", "previousReview"]);

/** An audit action's label; an action the page does not know shows as sent. */
export function auditActionLabel(action: string, t: Translate): string {
  return textOr(t, `audit_${action}`, action);
}

/** The smurf event an entry acted on, for a link to its detail; null for any other target. */
export function auditEventTarget(target: AuditTarget): { id: string; name: string } | null {
  return target.kind === "event" ? { id: target.id, name: target.name } : null;
}

/** What an override acted on: accounts, hash8 and event names only. A kind the page does not know shows as sent. */
export function auditTargetText(target: AuditTarget): string {
  switch (target.kind) {
    case "pair":
      return `${target.a} ↔ ${target.b}`;
    case "item":
      return `${target.itemKind} ${target.hash8} (${target.battleTag})`;
    case "identifier":
      return `${target.type} ${target.valueHash8}`;
    case "event":
      return target.name;
    default:
      return (target as { kind: string }).kind;
  }
}

/** One outcome value: a review state in the events page's words, else as sent. */
function outcomeValueText(field: string, value: string | number | boolean, t: Translate): string {
  return REVIEW_OUTCOME_FIELDS.has(field) && typeof value === "string" ? reviewLabel(value as Parameters<typeof reviewLabel>[0], t) : String(value);
}

/** The outcome fields the entry recorded, skipping null, false and internal ones; a true flag shows its label alone. */
export function auditOutcomeText(outcome: AuditEntry["outcome"], t: Translate): string {
  const parts = Object.entries(outcome)
    .filter(([field, value]) => value !== null && value !== false && !HIDDEN_OUTCOME_FIELDS.has(field))
    .map(([field, value]) => {
      const label = textOr(t, `outcome_${field}`, field);
      return value === true ? label : `${label}: ${outcomeValueText(field, value as string | number, t)}`;
    });
  return parts.length > 0 ? parts.join(" · ") : t(key("dash"));
}

/** The shown history plus the next page (newest first): entries already shown are not repeated. */
export function appendAuditPage(current: AuditPage | null, page: AuditPage): AuditPage {
  const shown = current?.entries ?? [];
  const ids = new Set(shown.map((e) => e.id));
  return { entries: [...shown, ...page.entries.filter((e) => !ids.has(e.id))], next: page.next };
}
