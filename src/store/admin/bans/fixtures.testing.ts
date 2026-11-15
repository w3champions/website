import type { EGameMode } from "@/store/types";
import type { AccountSuggestion, AccountView, BanSummary, BanView, MachineIdRow, TagStatus } from "./types";

/** The fixed clock of the bans tests. */
export const FIXTURE_NOW = new Date("2026-11-15T12:00:00.000Z");

/** Invented mode names; the real ones come from the locale. */
export function fixtureModeName(mode: EGameMode): string {
  return `Mode ${mode}`;
}

export function banView(overrides: Partial<BanView> = {}): BanView {
  const issuedAt = overrides.issuedAt ?? "2026-11-02T00:00:00.000Z";
  return {
    id: "ban1",
    accountKey: "1001",
    battleTag: "Tester#1001",
    currentBattleTag: "Tester#1001",
    gameModes: [],
    endDate: "2026-12-02T00:00:00.000Z",
    banReason: "Test reason one",
    issuedAt,
    issuedBy: "ModOne#3001",
    status: "inEffect",
    lastChange: { kind: "issued", at: issuedAt, by: "ModOne#3001" },
    changes: [],
    revoked: null,
    otherBansInEffect: 0,
    version: 1,
    ...overrides,
  };
}

export function machineBanView(overrides: Partial<BanView> = {}): BanView {
  return banView({ machine: { machineIds: ["aa11bb22", "cc33dd44"], newMachineIdCount: 0, changes: [], version: 1 }, ...overrides });
}

export function accountView(overrides: Partial<AccountView> = {}): AccountView {
  return {
    accountKey: "1001",
    currentBattleTag: "Tester#1001",
    names: [{ battleTag: "Tester#1001", banCount: 0, current: true, lastBannedAt: null }],
    counts: { total: 0, inEffect: 0, expired: 0, revoked: 0 },
    inEffect: { global: null, modes: [], bans: [] },
    lastExpiredBan: null,
    ...overrides,
  };
}

export function banSummary(overrides: Partial<BanSummary> = {}): BanSummary {
  return {
    banId: "ban1",
    gameModes: [],
    endDate: "2026-12-02T00:00:00.000Z",
    status: "inEffect",
    banReason: "Test reason one",
    issuedBy: "ModOne#3001",
    ...overrides,
  };
}

export function accountSuggestion(overrides: Partial<AccountSuggestion> = {}): AccountSuggestion {
  return { accountKey: "1001", matchedBattleTag: "Tester#1001", currentBattleTag: "Tester#1001", nameCount: 1, bansInEffect: 0, bansTotal: 0, ...overrides };
}

export function machineIdRow(overrides: Partial<MachineIdRow> = {}): MachineIdRow {
  return {
    machineId: "aa11bb22",
    firstUsed: "2026-04-01T00:00:00.000Z",
    lastUsed: "2026-11-13T00:00:00.000Z",
    shared: false,
    recommended: true,
    otherAccountCount: 0,
    otherAccountsCapped: false,
    ...overrides,
  };
}

export function tagStatus(overrides: Partial<TagStatus> = {}): TagStatus {
  return { battleTag: "Tester#1001", accountKey: "1001", state: "neverBanned", ban: null, ...overrides };
}

const MOD_ONE = "ModOne#3001";
const MOD_TWO = "ModTwo#3002";

function specBan(id: string, gameModes: EGameMode[], endDate: string | null, by: string): BanView {
  return banView({ id, gameModes, endDate, issuedBy: by, lastChange: { kind: "issued", at: "2026-11-02T00:00:00.000Z", by }, otherBansInEffect: 4 });
}

function summaryOf(ban: BanView): BanSummary {
  return banSummary({ banId: ban.id, gameModes: ban.gameModes, endDate: ban.endDate, status: ban.status, banReason: ban.banReason, issuedBy: ban.issuedBy });
}

/** A worked example account (invented values): five bans in effect at FIXTURE_NOW. */
export const SPEC_BANS: BanView[] = [
  specBan("g1", [], "2026-11-24T00:00:00.000Z", MOD_TWO),
  specBan("m1", [1], null, MOD_ONE),
  specBan("m2", [2], "2026-12-08T00:00:00.000Z", MOD_ONE),
  specBan("m34", [3, 4], "2026-11-27T00:00:00.000Z", MOD_ONE),
  // Ends before g1, so it is still a separate row of the table.
  specBan("ds", [1101], "2026-11-19T00:00:00.000Z", MOD_ONE),
];

const bySpecId = (id: string): BanView => SPEC_BANS.find((ban) => ban.id === id)!;

export const SPEC_ACCOUNT: AccountView = accountView({
  counts: { total: 5, inEffect: 5, expired: 0, revoked: 0 },
  inEffect: {
    global: { endDate: "2026-11-24T00:00:00.000Z", banId: "g1", by: MOD_TWO },
    modes: [
      { gameMode: 1, endDate: null, banId: "m1", by: MOD_ONE },
      { gameMode: 2, endDate: "2026-12-08T00:00:00.000Z", banId: "m2", by: MOD_ONE },
      { gameMode: 3, endDate: "2026-11-27T00:00:00.000Z", banId: "m34", by: MOD_ONE },
      { gameMode: 4, endDate: "2026-11-27T00:00:00.000Z", banId: "m34", by: MOD_ONE },
      { gameMode: 1101, endDate: "2026-11-19T00:00:00.000Z", banId: "ds", by: MOD_ONE },
    ],
    bans: ["m1", "m2", "m34", "g1", "ds"].map((id) => summaryOf(bySpecId(id))),
  },
});
