import { Gateways } from "@/store/ranking/types";
import { ETournamentFormat, ETournamentState } from "@/store/tournaments/types";
import { EGameMode, ERaceEnum } from "@/store/types";

export const TournamentStateLabel: { [key in ETournamentState]: string } = {
  [ETournamentState.INIT]: "Created",
  [ETournamentState.REGISTRATION]: "Registration",
  [ETournamentState.MATCH_GENERATION]: "Generating Matches",
  [ETournamentState.STARTED]: "In Progress",
  [ETournamentState.SHOW_WINNER]: "Finished",
  [ETournamentState.FINISHED]: "Finished",
  [ETournamentState.CANCELED]: "Cancelled",
};

export const ETournamentFormatLabel: { [key in ETournamentFormat]: string } = {
  [ETournamentFormat.SINGLE_ELIM]: "Single Elimination",
  [ETournamentFormat.DOUBLE_ELIM]: "Double Elimination",
  [ETournamentFormat.ROUND_ROBIN]: "Round Robin",
};

export const EGameModeLabel: { [key: number]: string } = {
  [EGameMode.GM_1ON1]: "1 vs 1",
};

export const ERaceEnumLabel: { [key: number]: string } = {
  [ERaceEnum.HUMAN]: "Human",
  [ERaceEnum.ORC]: "Orc",
  [ERaceEnum.NIGHT_ELF]: "Night Elf",
  [ERaceEnum.UNDEAD]: "Undead",
  [ERaceEnum.RANDOM]: "Random",
};

export const EGatewayLabel: { [key: number]: string } = {
  [Gateways.America]: "America",
  [Gateways.Europe]: "Europe",
  [Gateways.Asia]: "Asia",
};
