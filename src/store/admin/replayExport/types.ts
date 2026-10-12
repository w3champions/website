import { EGameMode, ERaceEnum } from "@/store/types";
import { Gateways } from "@/store/ranking/types";

export enum EReplayExportOrder {
  Newest = 0,
  Oldest = 1,
  Random = 2,
}

export enum EReplayExportMmrMode {
  EveryPlayer = 0,
  AnyPlayer = 1,
}

/** Request body of `api/admin/replay-export/preview`; mirrors website-backend `ReplayExportFilter`. */
export interface ReplayExportFilter {
  gameMode: EGameMode;
  seasons: number[];
  patch: string | null;
  from: string | null;
  to: string | null;
  gateWay: Gateways | null;
  mapName: string | null;
  battleTag: string | null;
  minMmr: number | null;
  maxMmr: number | null;
  mmrMode: EReplayExportMmrMode;
  race: ERaceEnum | null;
  opponentRace: ERaceEnum | null;
  minDurationSeconds: number | null;
  maxDurationSeconds: number | null;
  /** At most this many games in the list. Not sent: all games found, up to the limit of one download. */
  quantity?: number;
  /** When more games match than the list takes, the order selects which games are listed. */
  order: EReplayExportOrder;
  /** Leaves out the games of past downloads: of `excludeExportIds`, or of all when it is empty. */
  excludePastDownloads: boolean;
  excludeExportIds: string[];
}

export interface ReplayExportPatchWindow {
  from: string;
  to: string | null;
}

export interface ReplayExportPatchOption {
  version: string;
  windows: ReplayExportPatchWindow[];
}

/** The list price of replays; mirrors website-backend `ReplayExportPrices`. */
export interface ReplayExportPrices {
  currency: string;
  pricePerReplay: number;
  minimumPrice: number;
  /** True when the user does not pay. Today that is every user: the page is for admins, and admins download for free. */
  free: boolean;
}

export interface ReplayExportOptions {
  patches: ReplayExportPatchOption[];
  seasons: number[];
  mapNames: string[];
  maxQuantity: number;
  prices: ReplayExportPrices;
}

export interface ReplayExportPlayer {
  battleTag: string;
  race: ERaceEnum;
  rndRace: ERaceEnum | null;
  oldMmr: number | null;
  won: boolean;
}

export interface ReplayExportMatch {
  id: string;
  matchId: string;
  floMatchId: number;
  startTime: string;
  /** The order and the patch and date filters use this time. */
  endTime: string;
  durationInSeconds: number;
  gameMode: EGameMode;
  gateWay: Gateways;
  season: number;
  map: string;
  mapName: string | null;
  patch: string | null;
  averageMmr: number | null;
  teams: { players: ReplayExportPlayer[] }[];
}

export interface ReplayExportPreview {
  totalMatching: number;
  totalIsCapped: boolean;
  /** The ids of all listed games, in list order. The page selects and downloads by id. */
  matchIds: string[];
  /** The games of the first table page. The other pages come from `loadMatches`. */
  matches: ReplayExportMatch[];
}

export interface ReplayExportTicket {
  ticket: string;
  count: number;
  expiresAt: string;
  /** The list price; 0 for a repeat download. */
  price: number;
  /** False when the user does not pay (admins). */
  charged: boolean;
}

export interface ReplayExportDownload {
  by: string;
  at: string;
}

/** A finished download in the history. The server keeps no ZIP; a repeat download builds it again. */
export interface ReplayExportSummary {
  id: string;
  createdAt: string;
  requestedBy: string;
  label: string | null;
  description: string | null;
  requested: number;
  /** Replays in the ZIP. */
  count: number;
  failed: number;
  downloadCount: number;
  lastDownloadedAt: string;
  /** Who downloaded the ZIP and when: the first download, then each repeat download. */
  downloads: ReplayExportDownload[];
  /** The list price of the replays in the ZIP; 0 for downloads made before prices existed. */
  price: number;
  currency: string;
  /** False when the user did not pay (admins). */
  charged: boolean;
}

/**
 * What the filter form edits. Dates are "YYYY-MM-DD" (UTC days); durations are minutes.
 * A cleared Vuetify field sets null, so the text fields allow null.
 */
export interface ReplayExportForm {
  gameMode: EGameMode;
  seasons: number[];
  patch: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  gateWay: Gateways | null;
  mapName: string | null;
  battleTag: string | null;
  mmrRange: [number, number];
  mmrMode: EReplayExportMmrMode;
  race: ERaceEnum | null;
  opponentRace: ERaceEnum | null;
  minDurationMinutes: number | null;
  maxDurationMinutes: number | null;
  /** Empty: all games found, up to the limit of one download. */
  maxGames: number | null;
  order: EReplayExportOrder;
  excludePastDownloads: boolean;
  excludeExportIds: string[];
}

export type ReplayExportState = {
  options: ReplayExportOptions | null;
  preview: ReplayExportPreview | null;
  previewFilter: ReplayExportFilter | null;
  /** One line about the selection of the preview, for the download history. */
  previewDescription: string;
  /** The games of the table pages that were shown, by id. */
  matchesById: Record<string, ReplayExportMatch>;
  /** Number of table-page requests that are not done. */
  pagesLoading: number;
  exports: ReplayExportSummary[];
  exportsLoading: boolean;
  /** For admins: the downloads of all users. */
  allExports: ReplayExportSummary[];
  allExportsLoading: boolean;
  loading: boolean;
  error: string;
};
