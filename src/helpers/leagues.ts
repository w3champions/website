export interface LeagueInfo {
  key: string;
  name: string;
}

const leagues: Record<number, LeagueInfo> = {
  0: { key: "grandmaster", name: "Grand Master" },
  1: { key: "master", name: "Master" },
  2: { key: "adept", name: "Adept" },
  3: { key: "diamond", name: "Diamond" },
  4: { key: "platinum", name: "Platinum" },
  5: { key: "gold", name: "Gold" },
  6: { key: "silver", name: "Silver" },
  7: { key: "bronze", name: "Bronze" },
  8: { key: "grass", name: "Grass" },
};

export function leagueKeyFromOrder(order: number | undefined | null): string {
  return leagues[order ?? -1]?.key ?? "";
}

export function leagueNameFromOrder(order: number | undefined | null): string {
  return leagues[order ?? -1]?.name ?? "";
}
