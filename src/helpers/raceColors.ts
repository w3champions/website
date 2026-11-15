import { computed, type ComputedRef } from "vue";
import { useTheme } from "vuetify";
import { withAlpha } from "@/components/common/charts/colors";
import { getAsset } from "@/helpers/url-functions";
import { ERaceEnum } from "@/store/types";

/**
 * One race palette for every chart on the site, so a race is the same colour
 * wherever it appears. Kept fully opaque here; callers that want a fill apply
 * their own alpha.
 */
export const RACE_COLORS: Record<number, string> = {
  [ERaceEnum.RANDOM]: "rgb(120, 113, 117)",
  [ERaceEnum.HUMAN]: "rgb(54, 162, 235)",
  [ERaceEnum.ORC]: "rgb(214, 48, 49)",
  [ERaceEnum.UNDEAD]: "rgb(162, 89, 200)",
  [ERaceEnum.NIGHT_ELF]: "rgb(46, 173, 82)",
  [ERaceEnum.TOTAL]: "rgb(150, 150, 150)",
};

export const raceColor = (race: ERaceEnum, opacity = 1): string => withAlpha(RACE_COLORS[race] ?? RACE_COLORS[ERaceEnum.TOTAL], opacity);

/**
 * Path to the race's ladder icon, for legends and tables. Empty for TOTAL, which
 * stands for every race at once and has no icon of its own.
 */
export const raceIconSrc = (race: ERaceEnum): string => race !== ERaceEnum.TOTAL && ERaceEnum[race] ? getAsset(`raceIcons/${ERaceEnum[race]}.png`) : "";

/**
 * Race colours resolved against the active theme.
 *
 * TOTAL stands for every race at once — the single series returned for modes
 * that don't rate races separately — so it has no colour of its own and takes
 * the theme's primary instead: the site's gold on the dark themes, and the blue
 * or brown the light themes use in its place. Going through the theme rather
 * than hardcoding gold means it always has enough contrast on its own
 * background.
 */
export const useRaceColors = (): {
  raceColor: (race: ERaceEnum, opacity?: number) => string;
  combinedColor: ComputedRef<string>;
} => {
  const theme = useTheme();
  const combinedColor = computed<string>(() => theme.current.value.colors.primary);

  return {
    combinedColor,
    raceColor: (race: ERaceEnum, opacity = 1): string => race === ERaceEnum.TOTAL ? withAlpha(combinedColor.value, opacity) : raceColor(race, opacity),
  };
};
