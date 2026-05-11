import { defineStore } from "pinia";
import { CommonState } from "./types";
import { HeroFilter } from "../heroes";
import HeroService from "@/services/HeroService";

let heroFiltersRequest: Promise<HeroFilter[]> | null = null;

export const useCommonStore = defineStore("commonState", {
  state: (): CommonState => ({
    heroFilters: [] as HeroFilter[],
  } as CommonState),
  actions: {
    async loadHeroFilters() {
      if (this.heroFilters.length > 0) {
        return this.heroFilters;
      }

      if (!heroFiltersRequest) {
        heroFiltersRequest = HeroService.retrieveHeroes();
      }

      try {
        const filters = await heroFiltersRequest;
        this.SET_HERO_FILTERS(filters);
        return filters;
      } finally {
        heroFiltersRequest = null;
      }
    },
    getDefaultHeroFilter(): HeroFilter | undefined {
      if (this.heroFilters.length > 0) {
        return this.heroFilters.find((hero) => hero.name === "all");
      } else {
        return undefined;
      }
    },
    SET_HERO_FILTERS(heroFilters: HeroFilter[]): void {
      this.heroFilters = heroFilters;
    },
  },
});
