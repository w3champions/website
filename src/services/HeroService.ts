import { API_URL } from "@/main";
import { HeroFilter } from "@/store/heroes";

export default class HeroService {
  public static async retrieveHeroes(): Promise<HeroFilter[]> {
    const url = `${API_URL}api/hero/filters`;
    const response = await fetch(url);
    return await response.json();
  }
}
