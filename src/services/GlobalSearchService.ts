import { API_URL } from "@/main";
import { PlayerSearchInfo } from "@/store/globalSearch/types";

export default class GlobalSearchService {
  // search: the string to search by
  // lastRelevanceId: the last id in the currently loaded list (used for pagination)
  // pageSize: the number of players to fetch at a time
  public static async search(search: string, lastRelevanceId: string, pageSize: number): Promise<PlayerSearchInfo[]> {
    let url = `${API_URL}api/players/global-search?search=${encodeURIComponent(search)}&pageSize=${pageSize}`;
    if (lastRelevanceId) {
      url += `&lastRelevanceId=${encodeURIComponent(lastRelevanceId)}`;
    }

    const players = await fetch(url).then((response) => response.json());

    return await players;
  }
}
