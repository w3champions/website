import type { AuditEntry, AuditPage, AuditTarget } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { key, textOr, type Translate } from "./translate";

/** An audit action's label; an action the page does not know shows as sent. */
export function auditActionLabel(action: string, t: Translate): string {
  return textOr(t, `audit_${action}`, action);
}

/** What an override acted on: accounts and hash8 only. */
export function auditTargetText(target: AuditTarget): string {
  switch (target.kind) {
    case "pair":
      return `${target.a} ↔ ${target.b}`;
    case "item":
      return `${target.itemKind} ${target.hash8} (${target.battleTag})`;
    case "identifier":
      return `${target.type} ${target.valueHash8}`;
  }
}

/** The outcome fields the entry recorded, skipping null and false. */
export function auditOutcomeText(outcome: AuditEntry["outcome"], t: Translate): string {
  const parts = Object.entries(outcome)
    .filter(([, value]) => value !== null && value !== false)
    .map(([field, value]) => `${textOr(t, `outcome_${field}`, field)}: ${String(value)}`);
  return parts.length > 0 ? parts.join(" · ") : t(key("dash"));
}

/** The shown history plus the next page (newest first): entries already shown are not repeated. */
export function appendAuditPage(current: AuditPage | null, page: AuditPage): AuditPage {
  const shown = current?.entries ?? [];
  const ids = new Set(shown.map((e) => e.id));
  return { entries: [...shown, ...page.entries.filter((e) => !ids.has(e.id))], next: page.next };
}
