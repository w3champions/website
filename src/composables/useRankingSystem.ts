import { useRankingStore } from "@/store/ranking/store";
import { EGameMode } from "@/store/types";
import { type RankingSystem, rankingSystemForSeason } from "@/helpers/progression-rank";

// Re-exported so existing importers (e.g. ModeStatsGrid.vue) keep importing the type from here.
export type { RankingSystem };

interface UseRankingSystem {
  resolveRankingSystem: (gameMode: EGameMode, viewedSeason: number) => RankingSystem;
}

// Resolves which ranking system a (mode, viewedSeason) renders, and ensures the
// per-mode flags are loaded. `retrieveActiveGameModes` is idempotent.
export function useRankingSystem(): UseRankingSystem {
  const rankingsStore = useRankingStore();

  // Fire-and-forget; reactive consumers update when activeModes populate.
  rankingsStore.retrieveActiveGameModes();

  // Call this from a reactive context (computed / watchEffect / template): it reads the
  // reactive activeModes, so a consumer re-evaluates once the (async, idempotent) load above
  // resolves. Before activeModes is populated, every mode resolves to "rp".
  function resolveRankingSystem(gameMode: EGameMode, viewedSeason: number): RankingSystem {
    const mode = rankingsStore.activeModes.find((m) => m.id === gameMode);
    return rankingSystemForSeason(mode?.progressionStartSeason, viewedSeason);
  }

  return { resolveRankingSystem };
}
