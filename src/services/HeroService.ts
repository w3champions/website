import { API_URL } from "@/config/env";
import { HeroFilter } from "@/store/heroes";

export default class HeroService {
  public static async retrieveHeroes(): Promise<HeroFilter[]> {
    const url = `${API_URL}api/hero/filters`;
    const dateString = new Date().toISOString().split("T")[0];
    const response = await fetch(`${url}?date=${dateString}`);
    return await response.json();
  }
}
