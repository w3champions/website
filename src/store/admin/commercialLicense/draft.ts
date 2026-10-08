import type { CommercialLicenseTaggedPlayer, CommercialLicenseTagRequest } from "./types";

/** Backend limit (contract C1/C2): note is 0..500 characters. */
export const NOTE_MAX_LENGTH = 500;

/** Problem reported by validateDraft for an over-long note. */
export const NOTE_TOO_LONG_PROBLEM = `The note can be at most ${NOTE_MAX_LENGTH} characters.`;

/** Form state of the add/edit dialog. Phase 2 adds its restriction fields here. */
export interface CommercialLicenseDraft {
  battleTag: string;
  note: string;
  notify: boolean;
}

export function emptyDraft(): CommercialLicenseDraft {
  return { battleTag: "", note: "", notify: true };
}

export function draftFromTag(tag: CommercialLicenseTaggedPlayer): CommercialLicenseDraft {
  return { battleTag: tag.battleTag, note: tag.note, notify: tag.notify };
}

export function toTagRequest(draft: CommercialLicenseDraft): CommercialLicenseTagRequest {
  return { note: draft.note, notify: draft.notify };
}

/**
 * Returns the first problem with the draft, or null when it can be saved.
 * The backend upserts, so an "add" of an already tagged player would silently
 * overwrite its note; that is rejected here instead.
 */
export function validateDraft(draft: CommercialLicenseDraft, isEdit: boolean, existingBattleTags: string[]): string | null {
  if (!draft.battleTag) return "Select a player.";
  if (!isEdit && existingBattleTags.some((t) => t.toLowerCase() === draft.battleTag.toLowerCase())) {
    return "This player is already tagged. Edit the existing entry instead.";
  }
  if (draft.note.length > NOTE_MAX_LENGTH) return NOTE_TOO_LONG_PROBLEM;
  return null;
}
