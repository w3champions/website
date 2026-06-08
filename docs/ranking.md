# Progression ranking — website

The website renders the public ladder, leaderboards, and profiles. A new progression ranking system runs
alongside the legacy "RP" ladder; each game mode uses exactly one, selected per mode by a season flag.

## `ActiveGameMode.progressionStartSeason`

`rankingStore.activeModes` (fetched from `api/ladder/active-modes` via `RankingService`) carries
`progressionStartSeason: number | null` on each `ActiveGameMode` (`src/store/ranking/types.ts`):

- `null` — the mode uses the legacy RP ladder.
- a number `N` — the mode uses the new progression system from season `N` onward.

Selection rule, applied where rank is rendered: use the new system iff
`progressionStartSeason != null && viewedSeason >= progressionStartSeason`, else RP. The value is the raw
season (not a pre-resolved label) so a viewed past season resolves correctly. Precedent for a season-gated
flag in this repo: `GATEWAY_REQUIRED_UNTIL_SEASON` (`src/constants.ts`). At this stage the flag is typed
but not yet read by any component.

## File reference

| Concern | Path |
|---|---|
| `ActiveGameMode` type | `src/store/ranking/types.ts` |
| Fetch + store | `src/services/RankingService.ts`, `src/store/ranking/store.ts` |
