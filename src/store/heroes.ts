import { ERaceEnum } from "./typings";

export enum EHeroes {
  ARCHMAGE = "archmage",
  ALCHEMIST = "alchemist",
  FIRELORD = "avatarofflame",
  DARK_RANGER = "bansheeranger",
  BEASTMASTER = "beastmaster",
  BLADEMASTER = "blademaster",
  CRYPT_LORD = "cryptlord",
  DEATH_KNIGHT = "deathknight",
  DEMON_HUNTER = "demonhunter",
  DREAD_LORD = "dreadlord",
  FARSEER = "farseer",
  KEEPER_OF_THE_GROVE = "keeperofthegrove",
  LICH = "lich",
  MOUNTAIN_KING = "mountainking",
  PALADIN = "paladin",
  PANDAREN_BREWMASTER = "pandarenbrewmaster",
  PIT_LORD = "pitlord",
  PRIESTESS_OF_THE_MOON = "priestessofthemoon",
  NAGA_SEA_WITCH = "seawitch",
  SHADOW_HUNTER = "shadowhunter",
  BLOODMAGE = "sorceror",
  TAUREN_CHEFTAIN = "taurenchieftain",
  TINKER = "tinker",
  WARDEN = "warden",
}

export type HeroData = {
  [key: string]: {
    race: ERaceEnum;
  };
};

export const HERO_DATA: HeroData = {
  [EHeroes.ARCHMAGE]: {
    race: ERaceEnum.HUMAN,
  },
  [EHeroes.BLOODMAGE]: {
    race: ERaceEnum.HUMAN,
  },
  [EHeroes.MOUNTAIN_KING]: {
    race: ERaceEnum.HUMAN,
  },
  [EHeroes.PALADIN]: {
    race: ERaceEnum.HUMAN,
  },

  [EHeroes.BLADEMASTER]: {
    race: ERaceEnum.ORC,
  },
  [EHeroes.FARSEER]: {
    race: ERaceEnum.ORC,
  },
  [EHeroes.SHADOW_HUNTER]: {
    race: ERaceEnum.ORC,
  },
  [EHeroes.TAUREN_CHEFTAIN]: {
    race: ERaceEnum.ORC,
  },

  [EHeroes.CRYPT_LORD]: {
    race: ERaceEnum.UNDEAD,
  },
  [EHeroes.DEATH_KNIGHT]: {
    race: ERaceEnum.UNDEAD,
  },
  [EHeroes.DREAD_LORD]: {
    race: ERaceEnum.UNDEAD,
  },
  [EHeroes.LICH]: {
    race: ERaceEnum.UNDEAD,
  },

  [EHeroes.DEMON_HUNTER]: {
    race: ERaceEnum.NIGHT_ELF,
  },
  [EHeroes.KEEPER_OF_THE_GROVE]: {
    race: ERaceEnum.NIGHT_ELF,
  },
  [EHeroes.PRIESTESS_OF_THE_MOON]: {
    race: ERaceEnum.NIGHT_ELF,
  },
  [EHeroes.WARDEN]: {
    race: ERaceEnum.NIGHT_ELF,
  },

  [EHeroes.ALCHEMIST]: {
    race: ERaceEnum.RANDOM,
  },
  [EHeroes.FIRELORD]: {
    race: ERaceEnum.RANDOM,
  },
  [EHeroes.DARK_RANGER]: {
    race: ERaceEnum.RANDOM,
  },
  [EHeroes.BEASTMASTER]: {
    race: ERaceEnum.RANDOM,
  },
  [EHeroes.PANDAREN_BREWMASTER]: {
    race: ERaceEnum.RANDOM,
  },
  [EHeroes.PIT_LORD]: {
    race: ERaceEnum.RANDOM,
  },
  [EHeroes.NAGA_SEA_WITCH]: {
    race: ERaceEnum.RANDOM,
  },
  [EHeroes.TINKER]: {
    race: ERaceEnum.RANDOM,
  },
};
