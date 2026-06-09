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
flag in this repo: `GATEWAY_REQUIRED_UNTIL_SEASON` (`src/constants.ts`). The selection is implemented by
the `useRankingSystem` composable (`src/composables/useRankingSystem.ts`), which exposes
`resolveRankingSystem(gameMode, viewedSeason)` and ensures `activeModes` is loaded.

## New rank fields (`Ranking.progression`, `ModeStat.progression`)

`Ranking` (`src/store/ranking/types.ts`) and `ModeStat` (`src/store/player/types.ts`) carry an optional
`progression?: { league, division, points, apexPoints } | null` alongside the legacy RP fields, fetched
over the existing ladder / game-mode-stats endpoints. `null` means the entity has no progression rank for
that season/mode → render as Unranked. These fields drive the progression display (see Rendering below).
Additive: existing RP rendering is unaffected.

## Rendering

`ProgressionRank` (`src/components/ladder/ProgressionRank.vue`) renders a progression rank: the league icon
(`LeagueIcon`) plus, for the regular leagues, the division and a points-in-division bar (0–100); for the
apex leagues (Master / Grand Master) the apex points instead. League icons and the league/division
vocabulary are shared with the legacy ladder.

The per-mode branch is applied wherever rank is shown:

- Ladder grid (`src/components/ladder/RankingsGrid.vue`) — the rank column renders `ProgressionRank` for a
  progression mode and its header reads "Rank" instead of "Level"; players sharing a rank share a position
  number. `Rankings.vue` loads `activeModes` so the grid can resolve the per-mode flag.
- Profile league card (`src/components/player/PlayerLeague.vue`) — the league badge, division, and points
  come from `progression`.
- Profile mode-stats table (`src/components/player/ModeStatsGrid.vue`) — the rank cell renders per row; its
  shared column header reads "Rank".

A progression mode is a clean cutover: it never shows the legacy RP "Level". An entity with no progression
rank yet (`progression == null`) renders as Unranked.

## Win-milestone bar (`ModeStat.milestone`)

`ModeStat` (`src/store/player/types.ts`) carries an optional
`milestone?: { currentWins, previousTarget, nextTarget } | null`, served on the profile game-mode-stats
endpoint. It is a permanent, lifetime "always something to climb" win track, independent of rank — a raw
progress bar toward the next round-number win milestone. `MilestoneProgress`
(`src/components/ladder/MilestoneProgress.vue`) renders it as an in-band fill
`(currentWins − previousTarget) / (nextTarget − previousTarget)` (so it resets after each milestone) with a
`currentWins / nextTarget` label, echoing the RP "Level" bar's styling.

It is **profile-only** and shown **in addition to** the rank (the milestone track is decoupled from rank):
the bar mounts under the rank in the profile league card (`PlayerLeague.vue`) and the profile mode-stats
table (`ModeStatsGrid.vue`), only for progression modes and only when `milestone != null`. The ladder grid
does not show it. Additive: RP rendering and the progression-rank display are unaffected.

## File reference

| Concern | Path |
|---|---|
| `ActiveGameMode` type | `src/store/ranking/types.ts` |
| `ProgressionRank` / `MilestoneProgress` types | `src/store/ranking/types.ts` |
| Fetch + store | `src/services/RankingService.ts`, `src/store/ranking/store.ts` |
| Per-mode selection | `src/composables/useRankingSystem.ts`, `src/helpers/progression-rank.ts` |
| Progression renderers | `src/components/ladder/ProgressionRank.vue`, `src/components/ladder/MilestoneProgress.vue` |
| Render sites | `src/components/ladder/RankingsGrid.vue`, `src/components/player/PlayerLeague.vue`, `src/components/player/ModeStatsGrid.vue`, `src/views/Rankings.vue` |
