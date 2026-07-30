// The minimum-length gate every search surface shares, measured the way the server measures it:
// in letters and digits, not raw length (global-search counts char.IsLetterOrDigit and rejects
// terms under 3 with a 400). Counting the same way keeps the frontend from dispatching requests
// the server will refuse — "mo " is 3 characters but 2 letters.
export function meetsSearchMinimum(term: string | null | undefined): boolean {
  return ((term ?? "").match(/[\p{L}\p{Nd}]/gu) ?? []).length >= 3;
}
