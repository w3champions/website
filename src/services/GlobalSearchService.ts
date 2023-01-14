import { API_URL } from "@/main";
import { PlayerSearchData } from "@/store/globalSearch/types";

export default class GlobalSearchService {
  // search: the string to search by
  // lastPlayerId: the last id in the currently loaded list (used for pagination)
  // pageSize: the number of players to fetch at a time
  public async search(search: string, lastPlayerId: string, pageSize: number): Promise<PlayerSearchData[]> {
    let url = `${API_URL}api/players/global-search?search=${encodeURIComponent(search)}&pageSize=${pageSize}`;
    if (lastPlayerId) {
      url += `&lastObjectId=${encodeURIComponent(lastPlayerId)}`;
    }

    const players = await fetch(url).then((response) => response.json());

    return await players;
  }
}
