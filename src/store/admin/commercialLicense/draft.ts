import type { CommercialLicenseTaggedPlayer, CommercialLicenseTagRequest, FloTvRestriction } from "./types";

/** Backend limit (contract C1/C2): note is 0..500 characters. */
export const NOTE_MAX_LENGTH = 500;

/** Problem reported by validateDraft for an over-long note. */
export const NOTE_TOO_LONG_PROBLEM = `The note can be at most ${NOTE_MAX_LENGTH} characters.`;

/** Form state of the add/edit dialog. The restriction fields are flat; toTagRequest nests them. */
export interface CommercialLicenseDraft {
  battleTag: string;
  note: string;
  notify: boolean;
  asPlayer: boolean;
  asObserver: boolean;
  floTv: FloTvRestriction;
}

export function emptyDraft(): CommercialLicenseDraft {
  return { battleTag: "", note: "", notify: true, asPlayer: false, asObserver: false, floTv: "none" };
}

export function draftFromTag(tag: CommercialLicenseTaggedPlayer): CommercialLicenseDraft {
  return {
    battleTag: tag.battleTag,
    note: tag.note,
    notify: tag.notify,
    asPlayer: tag.restrictions.asPlayer,
    asObserver: tag.restrictions.asObserver,
    floTv: tag.restrictions.floTv,
  };
}

/** Always includes `restrictions`: omitting it would make the backend keep the stored value. */
export function toTagRequest(draft: CommercialLicenseDraft): CommercialLicenseTagRequest {
  return {
    note: draft.note,
    notify: draft.notify,
    restrictions: { asPlayer: draft.asPlayer, asObserver: draft.asObserver, floTv: draft.floTv },
  };
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

/**
 * True when the search text no longer names the selected player, i.e. the user
 * edited the autocomplete after picking a result and the selection is stale.
 * Empty text is not an edit: Vuetify resets the search to "" on blur while the
 * selection stays shown, and an explicit clear arrives as `searchCleared`.
 */
export function isStaleSelection(selectedBattleTag: string, searchText: string): boolean {
  const text = searchText.trim();
  return selectedBattleTag !== "" && text !== "" && text.toLowerCase() !== selectedBattleTag.toLowerCase();
}
