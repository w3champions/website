import { test } from "vitest";
import { strict as assert } from "node:assert";
import { EGameMode, ERaceEnum } from "@/store/types";
import { EReplayExportMmrMode, EReplayExportOrder } from "./types";
import { activeFilters, clearFilter, defaultReplayExportForm, describeSelection, exportTitle, formatDuration, formatUtcMinute, MMR_SLIDER_MAX, parseMmrRange, patchPeriods, playedRace, toReplayExportFilter, utcDayToIso } from "./filters";

test("utcDayToIso reads days as UTC and makes the end date inclusive", () => {
  assert.equal(utcDayToIso("2026-10-08"), "2026-10-08T00:00:00.000Z");
  assert.equal(utcDayToIso("2026-10-08", true), "2026-10-09T00:00:00.000Z");
  assert.equal(utcDayToIso("2026-12-31", true), "2027-01-01T00:00:00.000Z");
  assert.equal(utcDayToIso(""), null);
  assert.equal(utcDayToIso("8/10/2026"), null);
});

test("the default form sends no MMR, date or race limits", () => {
  const filter = toReplayExportFilter(defaultReplayExportForm());
  assert.equal(filter.minMmr, null);
  assert.equal(filter.maxMmr, null);
  assert.equal(filter.from, null);
  assert.equal(filter.race, null);
  assert.deepEqual(filter.seasons, []);
  assert.equal(filter.excludePastDownloads, false);
  // No quantity: the list has all games found, up to the limit of one download.
  assert.equal("quantity" in filter, false);
});

test("Max games is sent as the quantity, and shows as a chip that clears it", () => {
  const form = { ...defaultReplayExportForm(), maxGames: 300 };
  assert.equal(toReplayExportFilter(form).quantity, 300);
  const chip = activeFilters(form, String).find((f) => f.key === "maxGames");
  assert.equal(chip?.text, "At most 300 games");
  clearFilter(form, "maxGames");
  assert.equal(form.maxGames, null);
  assert.equal("quantity" in toReplayExportFilter(form), false);
});

test("seasons, patch and dates are all sent; the backend combines them", () => {
  const form = { ...defaultReplayExportForm(), seasons: [23, 21], patch: "3.0.0", dateFrom: "2026-10-01", dateTo: "2026-10-05" };
  const filter = toReplayExportFilter(form);
  assert.deepEqual(filter.seasons, [21, 23]);
  assert.equal(filter.patch, "3.0.0");
  assert.equal(filter.from, "2026-10-01T00:00:00.000Z");
  assert.equal(filter.to, "2026-10-06T00:00:00.000Z");
});

test("the slider ends mean no limit; values inside are sent", () => {
  const form = { ...defaultReplayExportForm(), mmrRange: [1800, MMR_SLIDER_MAX] as [number, number] };
  assert.deepEqual([toReplayExportFilter(form).minMmr, toReplayExportFilter(form).maxMmr], [1800, null]);
  form.mmrRange = [0, 2400];
  assert.deepEqual([toReplayExportFilter(form).minMmr, toReplayExportFilter(form).maxMmr], [null, 2400]);
});

test("the opponent race only applies to 1v1 modes", () => {
  const form = { ...defaultReplayExportForm(), race: ERaceEnum.HUMAN, opponentRace: ERaceEnum.UNDEAD };
  assert.equal(toReplayExportFilter(form).opponentRace, ERaceEnum.UNDEAD);
  form.gameMode = EGameMode.GM_4ON4;
  assert.equal(toReplayExportFilter(form).opponentRace, null);
  assert.equal(toReplayExportFilter(form).race, ERaceEnum.HUMAN);
});

test("durations are minutes in the form and seconds in the filter", () => {
  const form = { ...defaultReplayExportForm(), minDurationMinutes: 5, maxDurationMinutes: 42.5 };
  assert.equal(toReplayExportFilter(form).minDurationSeconds, 300);
  assert.equal(toReplayExportFilter(form).maxDurationSeconds, 2550);
});

test("patchPeriods lists every window of a rolled-back patch", () => {
  const label = patchPeriods({
    version: "3.0.0",
    windows: [
      { from: "2026-09-13T00:00:00Z", to: "2026-10-07T00:00:00Z" },
      { from: "2026-10-08T22:00:00Z", to: null },
    ],
  });
  assert.equal(label, "13 Sep 2026 – 7 Oct 2026, since 8 Oct 2026");
});

test("playedRace shows the rolled race of random players", () => {
  assert.equal(playedRace({ battleTag: "a#1", race: ERaceEnum.RANDOM, rndRace: ERaceEnum.ORC, oldMmr: 1, won: true }), ERaceEnum.ORC);
  assert.equal(playedRace({ battleTag: "a#1", race: ERaceEnum.RANDOM, rndRace: null, oldMmr: 1, won: true }), ERaceEnum.RANDOM);
  assert.equal(playedRace({ battleTag: "a#1", race: ERaceEnum.NIGHT_ELF, rndRace: null, oldMmr: 1, won: true }), ERaceEnum.NIGHT_ELF);
});

test("formatDuration gives minutes and seconds", () => {
  assert.equal(formatDuration(754), "12:34");
  assert.equal(formatDuration(59), "0:59");
});

test("formatUtcMinute gives the UTC date and time", () => {
  assert.equal(formatUtcMinute("2026-10-12T08:40:59.000Z"), "2026-10-12 08:40");
  assert.equal(formatUtcMinute("2026-10-12T01:05:00+02:00"), "2026-10-11 23:05");
});

const raceName = (race: ERaceEnum) => ERaceEnum[race];

test("the default form has no summary chips", () => {
  assert.deepEqual(activeFilters(defaultReplayExportForm(), raceName), []);
});

test("summary chips describe each filter in short words", () => {
  const form = {
    ...defaultReplayExportForm(),
    seasons: [23],
    patch: "3.0.0",
    dateFrom: "2026-10-01",
    dateTo: "2026-10-05",
    mapName: " Echo Isles ",
    battleTag: "Happy#2384",
    mmrRange: [1600, 2600] as [number, number],
    race: ERaceEnum.HUMAN,
    opponentRace: ERaceEnum.UNDEAD,
    minDurationMinutes: 8,
  };
  assert.deepEqual(activeFilters(form, raceName).map((f) => f.text), [
    "Season 23",
    "Patch 3.0.0",
    "1 Oct 2026 – 5 Oct 2026",
    "Echo Isles",
    "Player Happy#2384",
    "MMR 1600–2600, all players",
    "HUMAN vs UNDEAD",
    "8+ min",
  ]);
});

test("summary chips for open MMR ranges, one race and team modes", () => {
  const form = {
    ...defaultReplayExportForm(),
    mmrRange: [1800, MMR_SLIDER_MAX] as [number, number],
    mmrMode: EReplayExportMmrMode.AnyPlayer,
    opponentRace: ERaceEnum.ORC,
    maxDurationMinutes: 20,
    dateTo: "2026-10-05",
  };
  assert.deepEqual(activeFilters(form, raceName).map((f) => f.text), ["Until 5 Oct 2026", "MMR 1800+, any player", "ORC vs any race", "up to 20 min"]);

  form.gameMode = EGameMode.GM_2ON2;
  form.race = ERaceEnum.NIGHT_ELF;
  form.mmrRange = [0, 2000];
  assert.deepEqual(activeFilters(form, raceName).map((f) => f.text), ["Until 5 Oct 2026", "MMR up to 2000, any player", "NIGHT_ELF in the game", "up to 20 min"]);
});

test("clearFilter removes only that filter", () => {
  const form = {
    ...defaultReplayExportForm(),
    seasons: [23],
    dateFrom: "2026-10-01",
    dateTo: "2026-10-05",
    race: ERaceEnum.HUMAN,
    opponentRace: ERaceEnum.ORC,
    excludePastDownloads: true,
    excludeExportIds: ["a"],
  };
  clearFilter(form, "dates");
  assert.deepEqual([form.dateFrom, form.dateTo, form.seasons], ["", "", [23]]);
  clearFilter(form, "races");
  assert.deepEqual([form.race, form.opponentRace], [null, null]);
  clearFilter(form, "seasons");
  assert.deepEqual(form.seasons, []);
  clearFilter(form, "pastDownloads");
  assert.deepEqual([form.excludePastDownloads, form.excludeExportIds], [false, []]);
  assert.deepEqual(activeFilters(form, raceName), []);
});

test("cleared fields (null) count as empty", () => {
  const form = { ...defaultReplayExportForm(), battleTag: null, dateFrom: null, dateTo: null };
  const filter = toReplayExportFilter(form);
  assert.deepEqual([filter.battleTag, filter.from, filter.to], [null, null, null]);
  assert.deepEqual(activeFilters(form, raceName), []);
});

test("parseMmrRange reads empty fields as no limit, clamps and orders", () => {
  assert.deepEqual(parseMmrRange("", ""), [0, MMR_SLIDER_MAX]);
  assert.deepEqual(parseMmrRange("1600", ""), [1600, MMR_SLIDER_MAX]);
  assert.deepEqual(parseMmrRange("2600", "1600"), [1600, 2600]);
  assert.deepEqual(parseMmrRange("-5", "9000"), [0, MMR_SLIDER_MAX]);
  assert.equal(parseMmrRange("abc", ""), null);
});

test("past downloads: all of them, or the selected ones; ignored when the switch is off", () => {
  const form = { ...defaultReplayExportForm(), excludePastDownloads: true, seasons: [23, 21] };
  assert.deepEqual(activeFilters(form, raceName).map((f) => f.text), ["Seasons 21, 23", "Not in past downloads"]);
  assert.deepEqual(toReplayExportFilter(form).excludeExportIds, []);

  form.excludeExportIds = ["a", "b"];
  assert.deepEqual(activeFilters(form, raceName).map((f) => f.text), ["Seasons 21, 23", "Not in 2 past downloads"]);
  assert.deepEqual(toReplayExportFilter(form).excludeExportIds, ["a", "b"]);

  form.excludePastDownloads = false;
  assert.deepEqual(toReplayExportFilter(form).excludeExportIds, []);
  assert.equal(toReplayExportFilter(form).excludePastDownloads, false);
});

test("describeSelection gives one line for the download history", () => {
  const form = { ...defaultReplayExportForm(), seasons: [23], mmrRange: [1800, MMR_SLIDER_MAX] as [number, number] };
  assert.equal(
    describeSelection("1 vs 1", activeFilters(form, raceName), EReplayExportOrder.Random),
    "1 vs 1 · Season 23 · MMR 1800+, all players · random sample",
  );
});

test("exportTitle uses the label, or the date", () => {
  const summary = {
    id: "1",
    createdAt: "2026-10-12T09:00:00Z",
    requestedBy: "Admin#1",
    label: null,
    description: null,
    requested: 3,
    count: 3,
    failed: 0,
    downloadCount: 1,
    lastDownloadedAt: "2026-10-12T09:00:00Z",
    downloads: [{ by: "Admin#1", at: "2026-10-12T09:00:00Z" }],
    price: 5,
    currency: "USD",
    charged: false,
  };
  assert.equal(exportTitle(summary), "Download of 12 Oct 2026");
  assert.equal(exportTitle({ ...summary, label: "ACME #42" }), "ACME #42");
});
