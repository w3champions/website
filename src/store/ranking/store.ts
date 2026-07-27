import type { ActiveGameMode, CountryRanking, Ladder, RankInContext, Ranking, RankingState, Season } from "./types";
import { type DataTableOptions, EGameMode, ERaceEnum } from "../types";
import { defineStore } from "pinia";
import isEmpty from "lodash/isEmpty";
import RankingService from "@/services/RankingService";
import GlobalSearchService from "@/services/GlobalSearchService";
import { PlayerSearchInfo } from "@/store/globalSearch/types";
import { USE_NEW_SEARCH } from "@/helpers/featureFlags";
import { useRootStateStore } from "@/store/rootState/store";
import { usePlayerStore } from "@/store/player/store";

// global-search is relevance-ranked and hard-capped at 20 results/page server-side; the ladder search
// box is an autocomplete, so a single page is all it shows.
const SEARCH_PAGE_SIZE = 20;

// Monotonic token guarding the two-call new-search path (global-search -> ranks-for-players). A slower
// earlier query can resolve after a faster later one; we only commit results from the latest search.
let latestSearchId = 0;

// Cursor for the next ladder-search page: the raw relevanceId of the last directory hit, exactly as
// global-search hands it out. Merging reshapes rows (per-race splits, AT dedupe), so the cursor must
// be kept from the raw page, never derived from a merged row.
let searchCursor = "";

// Backend sends null for the race of the zeroed/unranked tail; Ranking.race is typed non-null, so this
// localizes the one honest cast rather than loosening the shared type.
const NO_RACE = null as unknown as ERaceEnum;

// Build a battleTag -> ranks lookup. One tag can hold several ranks (1v1 is ranked per race), and an
// AT team rank covers both of its members' tags.
function indexRanksByBattleTag(ranks: RankInContext[]): Map<string, RankInContext[]> {
  const byTag = new Map<string, RankInContext[]>();
  for (const rank of ranks) {
    for (const player of rank.players) {
      const existing = byTag.get(player.battleTag);
      if (existing) {
        existing.push(rank);
      } else {
        byTag.set(player.battleTag, [rank]);
      }
    }
  }
  return byTag;
}

// Distinct row identity mirroring the backend's composite rank id (season_btag@gw…_mode[_race]).
// Rankings.vue keys autocomplete rows by player.id, and a player holds one 1v1 rank per race — a
// plain battleTag would collide those rows.
function rankId(rank: RankInContext): string {
  const tags = rank.players.map((p) => `${p.battleTag}@${rank.gateWay}`).join("_");
  return `${rank.season}_${tags}_${rank.gameMode}${rank.race != null ? `_${rank.race}` : ""}`;
}

function rankInContextToRanking(rank: RankInContext): Ranking {
  return {
    id: rankId(rank),
    season: rank.season,
    gateway: rank.gateWay,
    league: rank.league,
    leagueDivision: 0,
    leagueOrder: 0,
    race: rank.race ?? NO_RACE,
    leagueName: "",
    rankNumber: rank.rankNumber,
    rankingPoints: rank.rankingPoints,
    gameMode: rank.gameMode,
    player: {
      id: rankId(rank),
      // Joined like PlayerOverview.Name on the backend, so an AT row names both members.
      name: rank.players.map((p) => p.name).join(" & "),
      mmr: rank.mmr,
      gateWay: rank.gateWay,
      playerIds: rank.players,
      gameMode: rank.gameMode,
      season: rank.season,
      race: rank.race ?? undefined,
      wins: rank.wins,
      losses: rank.losses,
      games: rank.games,
      winrate: rank.games > 0 ? rank.wins / rank.games : 0,
    },
    playersInfo: [],
  };
}

// A directory hit with no rank in this context -> a zeroed row, mirroring the legacy ladder/search
// "unranked" tail (Undefined gateway/mode, season 0) so Rankings.vue renders it identically: games=0
// shows the "unranked" label and a click routes to the player's profile.
function unrankedRanking(player: PlayerSearchInfo): Ranking {
  return {
    id: player.battleTag,
    season: 0,
    gateway: 0,
    league: 0,
    leagueDivision: 0,
    leagueOrder: 0,
    race: NO_RACE,
    leagueName: "",
    rankNumber: 0,
    rankingPoints: 0,
    gameMode: EGameMode.UNDEFINED,
    player: {
      id: player.battleTag,
      name: player.name,
      mmr: 0,
      gateWay: 0,
      playerIds: [{ name: player.name, battleTag: player.battleTag }],
      gameMode: EGameMode.UNDEFINED,
      season: 0,
      race: undefined,
      wins: 0,
      losses: 0,
      games: 0,
      winrate: 0,
    },
    playersInfo: [],
  };
}

// Merge directory hits with their ranks-in-context. Enriched (ranked) rows are surfaced first, then the
// unranked directory tail — each group keeping global-search's relevance order: ladder standing for the
// ranked group, name relevance for the tail. A hit yields one row per rank it holds (1v1 is ranked per race,
// matching the legacy per-race rows); a team rank already emitted for one AT member is not repeated for
// the other, and a member whose ranks were all emitted that way is still ranked — never a zeroed row.
function mergeRanksIntoRankings(found: PlayerSearchInfo[], ranks: RankInContext[]): Ranking[] {
  const byTag = indexRanksByBattleTag(ranks);
  const emitted = new Set<RankInContext>();
  const ranked: Ranking[] = [];
  const unranked: Ranking[] = [];
  for (const player of found) {
    const playerRanks = byTag.get(player.battleTag);
    if (playerRanks) {
      for (const rank of playerRanks) {
        if (emitted.has(rank)) continue;
        emitted.add(rank);
        ranked.push(rankInContextToRanking(rank));
      }
    } else {
      unranked.push(unrankedRanking(player));
    }
  }
  return [...ranked, ...unranked];
}

export const useRankingStore = defineStore("ranking", {
  state: (): RankingState => ({
    league: 0,
    page: 0,
    totalRanks: 0,
    loading: false,
    ladders: [],
    rankings: [],
    topFive: [],
    searchRanks: [],
    searchHasMore: false,
    countryRankings: [],
    countryRankingsLoading: false,
    gameMode: EGameMode.GM_1ON1,
    seasons: [] as Season[],
    selectedSeason: {} as Season,
    selectedCountry: "",
    activeModes: [] as ActiveGameMode[],
  }),
  actions: {
    async retrieveRankings(options?: DataTableOptions, showLoading: boolean = true) {
      if (options && options.page != null) {
        this.SET_PAGE(options.page - 1);
      }
      if (showLoading) {
        this.SET_LOADING(true);
      }
      try {
        const player = usePlayerStore();
        const rootStateStore = useRootStateStore();
        const response = await RankingService.retrieveRankings(
          this.league,
          rootStateStore.gateway,
          this.gameMode,
          this.selectedSeason.id ?? player.selectedSeason.id,
        );
        this.SET_TOTAL_RANKS(response.length);
        this.SET_RANKINGS(response);
      } finally {
        if (showLoading) {
          this.SET_LOADING(false);
        }
      }
    },
    async getTopFive() {
      const rootStateStore = useRootStateStore();
      const rankings = await RankingService.retrieveRankings(
        0,
        rootStateStore.gateway,
        EGameMode.GM_1ON1,
        this.selectedSeason.id,
      );
      this.SET_TOP_FIVE(rankings.slice(0, 5));
    },
    async getCountryRankings() {
      this.SET_COUNTRY_RANKINGS_LOADING(true);
      const rootStateStore = useRootStateStore();
      const rankings = await RankingService.retrieveCountryRankings(
        this.selectedCountry,
        rootStateStore.gateway,
        this.gameMode,
        this.selectedSeason.id,
      );
      this.SET_COUNTRY_RANKINGS(rankings);
      this.SET_COUNTRY_RANKINGS_LOADING(false);
    },
    async search(search: { searchText: string; gameMode: EGameMode; append?: boolean }) {
      const rootStateStore = useRootStateStore();
      const gateway = rootStateStore.gateway;
      const season = this.selectedSeason.id;

      if (!USE_NEW_SEARCH) {
        // legacy ladder search — remove this branch with USE_NEW_SEARCH
        // (it returns the full result set in one response; there is never a next page to append)
        if (search.append) return;
        const rankings = await RankingService.searchRankings(
          search.searchText,
          gateway,
          search.gameMode,
          season,
        );
        this.SET_SEARCH_RANKINGS(rankings);
        return;
      }

      // New consolidated path: one directory lookup (global-search) + one rank-in-context enrichment,
      // merged into the Ranking[] shape Rankings.vue already renders.
      //
      // The directory lookup is given this ladder as context, so it ranks its hits by standing on it
      // and the page cut lands on the ranked players first. Without it the cut is made on name
      // relevance, which is orthogonal to being on this ladder, so most ranked matches fall past it.
      //
      // An append continues the latest search rather than starting a new one: it keeps the current
      // searchId (so a real new search still supersedes it) and passes the pagination cursor.
      if (search.append && (!this.searchHasMore || !searchCursor)) return;
      const searchId = search.append ? latestSearchId : ++latestSearchId;
      const found = await GlobalSearchService.search(search.searchText, search.append ? searchCursor : "", SEARCH_PAGE_SIZE, {
        season,
        gateway,
        gameMode: search.gameMode,
      });
      if (searchId !== latestSearchId) return; // a newer search superseded this one

      const battleTags = found.map((p) => p.battleTag);
      const ranks = battleTags.length
        ? await RankingService.searchRanksForPlayers(battleTags, gateway, search.gameMode, season)
        : [];
      if (searchId !== latestSearchId) return;

      searchCursor = found.length ? found[found.length - 1].relevanceId : "";
      this.SET_SEARCH_HAS_MORE(found.length === SEARCH_PAGE_SIZE);
      const rows = mergeRanksIntoRankings(found, ranks);
      if (search.append) {
        this.APPEND_SEARCH_RANKINGS(rows);
      } else {
        this.SET_SEARCH_RANKINGS(rows);
      }
    },
    clearSearch() {
      latestSearchId++; // an in-flight search must not repopulate a cleared box
      searchCursor = "";
      this.SET_SEARCH_RANKINGS([]);
      this.SET_SEARCH_HAS_MORE(false);
    },
    setLeague(league: number) {
      this.SET_LEAGUE(league);
    },
    setSeason(season: Season) {
      this.SET_SELECTED_SEASON(season);
    },
    async setCountry(country: string) {
      this.SET_COUNTRY(country);
      await this.getCountryRankings();
    },
    async setGameMode(gameMode: EGameMode) {
      this.SET_GAME_MODE(gameMode);
      await this.retrieveRankings(undefined);
    },
    async retrieveLeagueConstellation() {
      const ladders = await RankingService.retrieveLadders(
        this.selectedSeason.id,
      );
      this.SET_LEAGUE_CONSTELLATION(ladders);
    },
    async retrieveSeasons() {
      // Seasons already fetched, skip
      if (!isEmpty(this.seasons)) {
        return;
      }
      const seasons = await RankingService.retrieveSeasons();
      this.SET_SEASONS(seasons);
    },
    async retrieveActiveGameModes() {
      // Currently active game modes already fetched, skip
      if (!isEmpty(this.activeModes)) {
        return;
      }
      const modes = await RankingService.retrieveActiveGameModes();
      if (modes) {
        this.SET_ACTIVE_MODES(modes);
      }
    },
    SET_RANKINGS(rankings: Ranking[]): void {
      this.rankings = rankings;
    },
    SET_PAGE(page: number): void {
      this.page = page;
    },
    SET_TOTAL_RANKS(totalRanks: number): void {
      this.totalRanks = totalRanks;
    },
    SET_TOP_FIVE(rankings: Ranking[]): void {
      this.topFive = rankings;
    },
    SET_SEARCH_RANKINGS(rankings: Ranking[]): void {
      this.searchRanks = rankings;
    },
    APPEND_SEARCH_RANKINGS(rankings: Ranking[]): void {
      // An AT team rank covers two members; when they land on different pages the later page
      // re-emits the shared row — drop anything already listed.
      const listed = new Set(this.searchRanks.map((r) => r.id));
      this.searchRanks = [...this.searchRanks, ...rankings.filter((r) => !listed.has(r.id))];
    },
    SET_SEARCH_HAS_MORE(hasMore: boolean): void {
      this.searchHasMore = hasMore;
    },
    SET_COUNTRY_RANKINGS(rankings: CountryRanking[]): void {
      this.countryRankings = rankings;
    },
    SET_COUNTRY_RANKINGS_LOADING(isLoading: boolean): void {
      this.countryRankingsLoading = isLoading;
    },
    SET_LEAGUE(league: number): void {
      this.league = league;
    },
    SET_LEAGUE_CONSTELLATION(ladders: Ladder[]): void {
      this.ladders = ladders;
    },
    SET_GAME_MODE(gameMode: EGameMode): void {
      this.gameMode = gameMode;
    },
    SET_SEASONS(seasons: Season[]): void {
      this.seasons = seasons;
    },
    SET_SELECTED_SEASON(season: Season): void {
      this.selectedSeason = season;
    },
    SET_COUNTRY(country: string): void {
      this.selectedCountry = country;
    },
    SET_ACTIVE_MODES(modes: ActiveGameMode[]) {
      this.activeModes = modes;
    },
    SET_LOADING(isLoading: boolean): void {
      this.loading = isLoading;
    },
  },
});
