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
flag in this repo: `GATEWAY_REQUIRED_UNTIL_SEASON` (`src/constants.ts`). The rule is a pure
helper `rankingSystemForSeason(progressionStartSeason, viewedSeason)` (`src/helpers/progression-rank.ts`);
the `useRankingSystem` composable (`src/composables/useRankingSystem.ts`) looks up the mode's flag and
delegates to it, exposing `resolveRankingSystem(gameMode, viewedSeason)` and ensuring `activeModes` is loaded.

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

## Ladder navigation (progression modes)

For a progression mode, the rankings view (`src/views/Rankings.vue`) replaces the legacy RP league selector
with the progression tier list and routes the selection to one of two views. The selector lists, best to
worst: **Grand Master**, **Master**, then each regular league (Adept … Grass) split into divisions I–IV.
The tier list comes from `progressionTiers()` / `progressionTierGroups()` (`src/helpers/progression-leagues.ts`).

- **Apex tiers (Grand Master, Master)** open the apex leaderboard view (below).
- **Non-apex tiers (league + division)** open the progression league ladder, rendered by
  `ProgressionLadderGrid` (`src/components/ladder/ProgressionLadderGrid.vue`) from
  `GET /api/ladder/progression?season=&gameMode=&league=&division=&race=`.

Two controls adapt to the progression system:

- The **gateway selector is hidden** for progression modes — progression standings are global
  (gateway-agnostic).
- The **race selector appears only for the race-split 1v1 ladder**, i.e. from the race-split start season
  onward (`RACE_SPLIT_START_SEASON`, `src/constants.ts`, mirroring the backend). Its value is passed to the
  progression-ladder request; the apex leaderboard is pooled across races and ignores it.

The legacy RP ladder navigation is unchanged: RP modes keep the existing league selector, gateway selector,
and `RankingsGrid` render. The progression behaviour is purely additive and branched per mode.

### Why a separate grid for the progression ladder

The progression-ladder endpoint intentionally returns rows **without** the legacy per-player overview that
the RP ladder carries — each row exposes only `playersInfo` plus the `progression` object. Because the
legacy `RankingsGrid` is built around that per-player overview, the non-apex progression ladder uses a
dedicated `ProgressionLadderGrid` that renders from `playersInfo` + `progression`, leaving the RP grid
untouched. This is a deliberate contract choice; the two grids stay independent.

## Apex leaderboard view

`ApexLeaderboardGrid` (`src/components/ladder/ApexLeaderboardGrid.vue`) renders the public apex leaderboard:
the **Grand Master** and **Master** cohort for a mode, ordered by apex points. A **cutoff line** marks the
boundary between the Grand Master cohort and the Master cohort, labelled with the cutoff apex points. Each
row shows the position, league icon, player cell (from `playersInfo`), and apex points. The view is reached
by selecting the Grand Master or Master tier for a progression mode.

Data comes from `GET /api/ladder/apex?season=&gameMode=` (anonymous, gateway-agnostic), fetched via
`RankingService.retrieveApexLeaderboard` into `rankingStore.apexLeaderboard`
(`{ cutoffApexPoints, gmCount, players }`). While loading or when there is no data, the view shows a loading
or empty state rather than the grid.

## File reference

| Concern | Path |
|---|---|
| `ActiveGameMode` type | `src/store/ranking/types.ts` |
| `ProgressionRank` type | `src/store/ranking/types.ts` |
| Fetch + store | `src/services/RankingService.ts`, `src/store/ranking/store.ts` |
| Per-mode selection | `src/composables/useRankingSystem.ts`, `src/helpers/progression-rank.ts` |
| Progression renderer | `src/components/ladder/ProgressionRank.vue` |
| Render sites | `src/components/ladder/RankingsGrid.vue`, `src/components/player/PlayerLeague.vue`, `src/components/player/ModeStatsGrid.vue`, `src/views/Rankings.vue` |
| Progression tier list | `src/helpers/progression-leagues.ts` |
| Progression ladder grid | `src/components/ladder/ProgressionLadderGrid.vue` |
| Apex leaderboard grid | `src/components/ladder/ApexLeaderboardGrid.vue` |
| Race-split start season | `src/constants.ts` (`RACE_SPLIT_START_SEASON`) |
