const BATTLE_TAG = /^[^\s#]+#\d+$/u;

/** The one tag compare of the page: equal ignoring case. */
export function sameTag(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function looksLikeBattleTag(author: string): boolean {
  return BATTLE_TAG.test(author);
}

/** "ModOne#3001" gives "ModOne"; free text is unchanged. */
export function authorName(author: string): string {
  return looksLikeBattleTag(author) ? author.slice(0, author.lastIndexOf("#")) : author;
}
