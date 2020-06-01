import { Moment } from "moment";
import { Gateways } from "./ranking/types";

export type RootState = {
  darkMode: boolean;
  gateway: Gateways;
};

export type DataTableOptions = {
  sortDest: boolean;
  page: number;
  itemsPerPage: number;
};

export type PlayerInTeam = {
  oldMmr: number;
  currentMmr: number;
  battleTag: string;
  name: string;
  mmrGain: number;
  race: ERaceEnum;
  won: boolean;
};

export type Team = {
  players: PlayerInTeam[];
};

export type Match = {
  map: string;
  id: number;
  durationInSeconds: number;
  startTime: Moment;
  endTime: Moment;
  gameMode: EGameMode;
  teams: Team[];
  gateWay: number;
  season: number;
};

export type MatchDetail = {
  match: Match;
  playerScores: PlayerScore[];
};

export interface Player {
  race: number;
  oldMmr: number;
  currentMmr: number;
  battleTag: string;
  name: string;
  id: string;
  mmrGain: number;
  won: boolean;
}

export interface UnitScore {
  unitsProduced: number;
  unitsKilled: number;
  largestArmy: number;
}

export interface Hero {
  icon: string;
  level: number;
}

export interface HeroScore {
  heroesKilled: number;
  itemsObtained: number;
  mercsHired: number;
  expGained: number;
}

export interface ResourceScore {
  goldCollected: number;
  lumberCollected: number;
  goldUpkeepLost: number;
}

export interface PlayerScore {
  battleTag: string;
  unitScore: UnitScore;
  heroes: Hero[];
  heroScore: HeroScore;
  resourceScore: ResourceScore;
}

export enum EGameMode {
  UNDEFINED,
  GM_1ON1 = 1,
  GM_2ON2_AT = 6,
  GM_4ON4 = 3,
  GM_FFA = 5,
}

export enum EPick {
  OVERALL,
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
}

export enum ERaceEnum {
  RANDOM = 0,
  HUMAN = 1,
  ORC = 2,
  NIGHT_ELF = 4,
  UNDEAD = 8,
  TOTAL = 16,
}

export enum ECountries {
  Afghanistan = "AF",
  AlandIslands = "AX",
  Albania = "AL",
  Algeria = "DZ",
  AmericanSamoa = "AS",
  Andorra = "AD",
  Angola = "AO",
  Anguilla = "AI",
  Antarctica = "AQ",
  AntiguaAndBarbuda = "AG",
  Argentina = "AR",
  Armenia = "AM",
  Aruba = "AW",
  Australia = "AU",
  Austria = "AT",
  Azerbaijan = "AZ",
  Bahamas = "BS",
  Bahrain = "BH",
  Bangladesh = "BD",
  Barbados = "BB",
  Belarus = "BY",
  Belgium = "BE",
  Belize = "BZ",
  Benin = "BJ",
  Bermuda = "BM",
  Bhutan = "BT",
  Bolivia = "BO",
  BosniaAndHerzegovina = "BA",
  Botswana = "BW",
  BouvetIsland = "BV",
  Brazil = "BR",
  BritishIndianOceanTerritory = "IO",
  BruneiDarussalam = "BN",
  Bulgaria = "BG",
  BurkinaFaso = "BF",
  Burundi = "BI",
  Cambodia = "KH",
  Cameroon = "CM",
  Canada = "CA",
  CapeVerde = "CV",
  CaymanIslands = "KY",
  CentralAfricanRepublic = "CF",
  Chad = "TD",
  Chile = "CL",
  China = "CN",
  ChristmasIsland = "CX",
  CocosKeelingIslands = "CC",
  Colombia = "CO",
  Comoros = "KM",
  Congo = "CG",
  CongoDemocraticRepublic = "CD",
  CookIslands = "CK",
  CostaRica = "CR",
  CoteDIvoire = "CI",
  Croatia = "HR",
  Cuba = "CU",
  Cyprus = "CY",
  CzechRepublic = "CZ",
  Denmark = "DK",
  Djibouti = "DJ",
  Dominica = "DM",
  DominicanRepublic = "DO",
  Ecuador = "EC",
  Egypt = "EG",
  ElSalvador = "SV",
  EquatorialGuinea = "GQ",
  Eritrea = "ER",
  Estonia = "EE",
  Ethiopia = "ET",
  FalklandIslands = "FK",
  FaroeIslands = "FO",
  Fiji = "FJ",
  Finland = "FI",
  France = "FR",
  FrenchGuiana = "GF",
  FrenchPolynesia = "PF",
  FrenchSouthernTerritories = "TF",
  Gabon = "GA",
  Gambia = "GM",
  Georgia = "GE",
  Germany = "DE",
  Ghana = "GH",
  Gibraltar = "GI",
  Greece = "GR",
  Greenland = "GL",
  Grenada = "GD",
  Guadeloupe = "GP",
  Guam = "GU",
  Guatemala = "GT",
  Guernsey = "GG",
  Guinea = "GN",
  GuineaBissau = "GW",
  Guyana = "GY",
  Haiti = "HT",
  HeardIslandMcdonaldIslands = "HM",
  HolySeeVaticanCityState = "VA",
  Honduras = "HN",
  HongKong = "HK",
  Hungary = "HU",
  Iceland = "IS",
  India = "IN",
  Indonesia = "ID",
  Iran = "IR",
  Iraq = "IQ",
  Ireland = "IE",
  IsleOfMan = "IM",
  Israel = "IL",
  Italy = "IT",
  Jamaica = "JM",
  Japan = "JP",
  Jersey = "JE",
  Jordan = "JO",
  Kazakhstan = "KZ",
  Kenya = "KE",
  Kiribati = "KI",
  Korea = "KR",
  Kuwait = "KW",
  Kyrgyzstan = "KG",
  LaoPeoplesDemocraticRepublic = "LA",
  Latvia = "LV",
  Lebanon = "LB",
  Lesotho = "LS",
  Liberia = "LR",
  LibyanArabJamahiriya = "LY",
  Liechtenstein = "LI",
  Lithuania = "LT",
  Luxembourg = "LU",
  Macao = "MO",
  Macedonia = "MK",
  Madagascar = "MG",
  Malawi = "MW",
  Malaysia = "MY",
  Maldives = "MV",
  Mali = "ML",
  Malta = "MT",
  MarshallIslands = "MH",
  Martinique = "MQ",
  Mauritania = "MR",
  Mauritius = "MU",
  Mayotte = "YT",
  Mexico = "MX",
  Micronesia = "FM",
  Moldova = "MD",
  Monaco = "MC",
  Mongolia = "MN",
  Montenegro = "ME",
  Montserrat = "MS",
  Morocco = "MA",
  Mozambique = "MZ",
  Myanmar = "MM",
  Namibia = "NA",
  Nauru = "NR",
  Nepal = "NP",
  Netherlands = "NL",
  NetherlandsAntilles = "AN",
  NewCaledonia = "NC",
  NewZealand = "NZ",
  Nicaragua = "NI",
  Niger = "NE",
  Nigeria = "NG",
  Niue = "NU",
  NorfolkIsland = "NF",
  NorthernMarianaIslands = "MP",
  Norway = "NO",
  Oman = "OM",
  Pakistan = "PK",
  Palau = "PW",
  PalestinianTerritory = "PS",
  Panama = "PA",
  PapuaNewGuinea = "PG",
  Paraguay = "PY",
  Peru = "PE",
  Philippines = "PH",
  Pitcairn = "PN",
  Poland = "PL",
  Portugal = "PT",
  PuertoRico = "PR",
  Qatar = "QA",
  Reunion = "RE",
  Romania = "RO",
  RussianFederation = "RU",
  Rwanda = "RW",
  SaintBarthelemy = "BL",
  SaintHelena = "SH",
  SaintKittsAndNevis = "KN",
  SaintLucia = "LC",
  SaintMartin = "MF",
  SaintPierreAndMiquelon = "PM",
  SaintVincentAndGrenadines = "VC",
  Samoa = "WS",
  SanMarino = "SM",
  SaoTomeAndPrincipe = "ST",
  SaudiArabia = "SA",
  Senegal = "SN",
  Serbia = "RS",
  Seychelles = "SC",
  SierraLeone = "SL",
  Singapore = "SG",
  Slovakia = "SK",
  Slovenia = "SI",
  SolomonIslands = "SB",
  Somalia = "SO",
  SouthAfrica = "ZA",
  SouthGeorgiaAndSandwichIsl = "GS",
  Spain = "ES",
  SriLanka = "LK",
  Sudan = "SD",
  Suriname = "SR",
  SvalbardAndJanMayen = "SJ",
  Swaziland = "SZ",
  Sweden = "SE",
  Switzerland = "CH",
  SyrianArabRepublic = "SY",
  Taiwan = "TW",
  Tajikistan = "TJ",
  Tanzania = "TZ",
  Thailand = "TH",
  TimorLeste = "TL",
  Togo = "TG",
  Tokelau = "TK",
  Tonga = "TO",
  TrinidadAndTobago = "TT",
  Tunisia = "TN",
  Turkey = "TR",
  Turkmenistan = "TM",
  TurksAndCaicosIslands = "TC",
  Tuvalu = "TV",
  Uganda = "UG",
  Ukraine = "UA",
  UnitedArabEmirates = "AE",
  UnitedKingdom = "GB",
  UnitedStates = "US",
  Uruguay = "UY",
  Uzbekistan = "UZ",
  Vanuatu = "VU",
  Venezuela = "VE",
  VietNam = "VN",
  VirginIslandsBritish = "VG",
  VirginIslandsUS = "VI",
  WallisAndFutuna = "WF",
  WesternSahara = "EH",
  Yemen = "YE",
  Zambia = "ZM",
  Zimbabw = "ZW"
}
