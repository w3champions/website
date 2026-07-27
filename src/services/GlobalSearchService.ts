import { API_URL } from "@/config/env";
import { PlayerSearchInfo } from "@/store/globalSearch/types";
import { EGameMode } from "@/store/types";
import { Gateways } from "@/store/ranking/types";

// A ladder to search in context of. Supplying one makes standing on that ladder part of relevance:
// ranked players sort ahead of the unranked, ordered by ladder standing (ranking points).
export interface LadderContext {
  season: number;
  gateway: Gateways;
  gameMode: EGameMode;
}

export default class GlobalSearchService {
  // search: the string to search by
  // lastRelevanceId: the last id in the currently loaded list (used for pagination)
  // pageSize: the number of players to fetch at a time
  // context: the ladder to rank results against — omit to order by name relevance alone
  public static async search(
    search: string,
    lastRelevanceId: string,
    pageSize: number,
    context?: LadderContext,
  ): Promise<PlayerSearchInfo[]> {
    let url = `${API_URL}api/players/global-search?search=${encodeURIComponent(search)}&pageSize=${pageSize}`;
    if (lastRelevanceId) {
      url += `&lastRelevanceId=${encodeURIComponent(lastRelevanceId)}`;
    }
    if (context) {
      url += `&season=${context.season}&gateWay=${context.gateway}&gameMode=${context.gameMode}`;
    }

    const players = await fetch(url).then((response) => response.json());

    return await players;
  }
}
