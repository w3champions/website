import { EGameMode, ERaceEnum } from "@/store/types";
import { Gateways } from "@/store/ranking/types";
import { EReplayExportMmrMode, EReplayExportOrder, ReplayExportFilter, ReplayExportForm, ReplayExportMode, ReplayExportPatchOption, ReplayExportPlayer, ReplayExportSummary } from "./types";

/** The slider ends here; a max at the end means "no upper limit". */
export const MMR_SLIDER_MAX = 3000;

export const ONE_VS_ONE_MODES = [EGameMode.GM_1ON1, EGameMode.GM_1ON1_TOURNAMENT, EGameMode.GM_PTR_1ON1, EGameMode.GM_ROC_1ON1];

export function defaultReplayExportForm(): ReplayExportForm {
  return {
    gameMode: EGameMode.GM_1ON1,
    seasons: [],
    patch: null,
    dateFrom: "",
    dateTo: "",
    gateWay: null,
    mapName: null,
    battleTag: "",
    mmrRange: [0, MMR_SLIDER_MAX],
    mmrMode: EReplayExportMmrMode.EveryPlayer,
    race: null,
    opponentRace: null,
    minDurationMinutes: null,
    maxDurationMinutes: null,
    maxGames: null,
    order: EReplayExportOrder.Newest,
    excludePastDownloads: false,
    excludeExportIds: [],
  };
}

/** "YYYY-MM-DD" as a UTC day → ISO instant of its start, or of the next day's start for an inclusive end. */
export function utcDayToIso(day: string | null, endOfDay = false): string | null {
  const trimmed = (day ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

export function toReplayExportFilter(form: ReplayExportForm): ReplayExportFilter {
  const [minMmr, maxMmr] = form.mmrRange;
  const minutes = (value: number | null) => (value === null || `${value}` === "" ? null : Math.round(Number(value) * 60));
  const isOneVsOne = ONE_VS_ONE_MODES.includes(form.gameMode);

  return {
    gameMode: form.gameMode,
    seasons: [...form.seasons].sort((a, b) => a - b),
    patch: form.patch || null,
    from: utcDayToIso(form.dateFrom),
    to: utcDayToIso(form.dateTo, true),
    gateWay: form.gateWay,
    mapName: form.mapName?.trim() || null,
    battleTag: form.battleTag?.trim() || null,
    minMmr: minMmr > 0 ? minMmr : null,
    maxMmr: maxMmr < MMR_SLIDER_MAX ? maxMmr : null,
    mmrMode: form.mmrMode,
    race: form.race,
    opponentRace: isOneVsOne ? form.opponentRace : null,
    minDurationSeconds: minutes(form.minDurationMinutes),
    maxDurationSeconds: minutes(form.maxDurationMinutes),
    ...(hasValue(form.maxGames) ? { quantity: Math.round(Number(form.maxGames)) } : {}),
    order: form.order,
    excludePastDownloads: form.excludePastDownloads,
    excludeExportIds: form.excludePastDownloads ? [...form.excludeExportIds] : [],
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The MMR range from the two number fields. An empty field means no limit. Values are clamped to the
 * slider and put in order. Returns null when a field is not a number.
 */
export function parseMmrRange(minText: string, maxText: string): [number, number] | null {
  const read = (text: string, empty: number) => (`${text}`.trim() === "" ? empty : Number(text));
  const min = read(minText, 0);
  const max = read(maxText, MMR_SLIDER_MAX);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  const clamp = (value: number) => Math.min(Math.max(Math.round(value), 0), MMR_SLIDER_MAX);
  return [Math.min(clamp(min), clamp(max)), Math.max(clamp(min), clamp(max))];
}

/** "13 Sep 2026" for an ISO instant or a "YYYY-MM-DD" UTC day. */
export function formatDay(value: string): string {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "13 Sep 2026 – 7 Oct 2026, since 8 Oct 2026": when the patch was live. */
export function patchPeriods(patch: ReplayExportPatchOption): string {
  return patch.windows.map((w) => (w.to ? `${formatDay(w.from)} – ${formatDay(w.to)}` : `since ${formatDay(w.from)}`)).join(", ");
}

/** "2026-10-12 08:40" in UTC. */
export function formatUtcMinute(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export type ReplayExportFilterKey =
  | "seasons"
  | "patch"
  | "dates"
  | "gateWay"
  | "mapName"
  | "battleTag"
  | "mmr"
  | "races"
  | "length"
  | "pastDownloads"
  | "maxGames";

export interface ReplayExportActiveFilter {
  key: ReplayExportFilterKey;
  text: string;
}

const GATEWAY_NAMES: Partial<Record<Gateways, string>> = {
  [Gateways.Europe]: "Europe",
  [Gateways.America]: "America",
  [Gateways.Asia]: "Asia",
};

/** A number field holds a number, null (cleared) or "" (emptied by typing). */
function hasValue(value: number | string | null): boolean {
  return value !== null && `${value}` !== "";
}

/** One short text per filter that limits the games, for the summary chips. */
/** `mode`: the history of the admin page has downloads, the one of the store has purchases. */
export function activeFilters(
  form: ReplayExportForm,
  raceName: (race: ERaceEnum) => string,
  mode: ReplayExportMode = "admin",
): ReplayExportActiveFilter[] {
  const filters: ReplayExportActiveFilter[] = [];
  const add = (key: ReplayExportFilterKey, text: string) => filters.push({ key, text });

  if (form.seasons.length > 0) add("seasons", seasonsText(form.seasons));
  if (form.patch) add("patch", `Patch ${form.patch}`);

  const from = (form.dateFrom ?? "").trim();
  const to = (form.dateTo ?? "").trim();
  if (from && to) add("dates", `${formatDay(from)} – ${formatDay(to)}`);
  else if (from) add("dates", `From ${formatDay(from)}`);
  else if (to) add("dates", `Until ${formatDay(to)}`);

  if (form.gateWay !== null) add("gateWay", GATEWAY_NAMES[form.gateWay] ?? `Gateway ${form.gateWay}`);
  if (form.mapName?.trim()) add("mapName", form.mapName.trim());
  if (form.battleTag?.trim()) add("battleTag", `Player ${form.battleTag.trim()}`);

  const [minMmr, maxMmr] = form.mmrRange;
  if (minMmr > 0 || maxMmr < MMR_SLIDER_MAX) {
    const range = maxMmr >= MMR_SLIDER_MAX ? `${minMmr}+` : minMmr <= 0 ? `up to ${maxMmr}` : `${minMmr}–${maxMmr}`;
    const who = form.mmrMode === EReplayExportMmrMode.EveryPlayer ? "all players" : "any player";
    add("mmr", `MMR ${range}, ${who}`);
  }

  const isOneVsOne = ONE_VS_ONE_MODES.includes(form.gameMode);
  const races = [form.race, isOneVsOne ? form.opponentRace : null].filter((r): r is ERaceEnum => r !== null);
  if (races.length === 2) add("races", `${raceName(races[0])} vs ${raceName(races[1])}`);
  else if (races.length === 1) add("races", isOneVsOne ? `${raceName(races[0])} vs any race` : `${raceName(races[0])} in the game`);

  const minLength = form.minDurationMinutes;
  const maxLength = form.maxDurationMinutes;
  if (hasValue(minLength) && hasValue(maxLength)) add("length", `${minLength}–${maxLength} min`);
  else if (hasValue(minLength)) add("length", `${minLength}+ min`);
  else if (hasValue(maxLength)) add("length", `up to ${maxLength} min`);

  if (form.excludePastDownloads) {
    const count = form.excludeExportIds.length;
    const [one, many] = mode === "store" ? ["purchase", "purchases"] : ["download", "downloads"];
    add("pastDownloads", count === 0 ? `Not in past ${many}` : `Not in ${count} past ${count === 1 ? one : many}`);
  }

  if (hasValue(form.maxGames)) add("maxGames", `At most ${Number(form.maxGames).toLocaleString("en-US")} games`);

  return filters;
}

/** "Season 23" or "Seasons 21, 23". */
export function seasonsText(seasons: number[]): string {
  const sorted = [...seasons].sort((a, b) => a - b);
  return `${sorted.length === 1 ? "Season" : "Seasons"} ${sorted.join(", ")}`;
}

export function orderText(order: EReplayExportOrder): string {
  return order === EReplayExportOrder.Random ? "random sample" : order === EReplayExportOrder.Oldest ? "oldest first" : "newest first";
}

/** One line about a selection, for the download history: "1 vs 1 · Season 23 · MMR 1800+, all players · newest first". */
export function describeSelection(gameModeName: string, filters: ReplayExportActiveFilter[], order: EReplayExportOrder): string {
  return [gameModeName, ...filters.map((f) => f.text), orderText(order)].join(" · ");
}

/** The name of a past download: its label, or its date. */
export function exportTitle(summary: ReplayExportSummary): string {
  return summary.label ?? `Download of ${formatDay(summary.createdAt)}`;
}

const FILTER_FIELDS: Record<ReplayExportFilterKey, (keyof ReplayExportForm)[]> = {
  seasons: ["seasons"],
  patch: ["patch"],
  dates: ["dateFrom", "dateTo"],
  gateWay: ["gateWay"],
  mapName: ["mapName"],
  battleTag: ["battleTag"],
  mmr: ["mmrRange"],
  races: ["race", "opponentRace"],
  length: ["minDurationMinutes", "maxDurationMinutes"],
  pastDownloads: ["excludePastDownloads", "excludeExportIds"],
  maxGames: ["maxGames"],
};

/** Removes the filter of one summary chip from the form. */
export function clearFilter(form: ReplayExportForm, key: ReplayExportFilterKey): void {
  const defaults = defaultReplayExportForm();
  for (const field of FILTER_FIELDS[key]) Object.assign(form, { [field]: defaults[field] });
}

/** The race the player played: a random player's rolled race when it is known. */
export function playedRace(player: ReplayExportPlayer): ERaceEnum {
  return player.race === ERaceEnum.RANDOM && player.rndRace ? player.rndRace : player.race;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
