import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const license = vi.hoisted(() => ({
  getTaggedPlayers: vi.fn(),
  upsertTaggedPlayer: vi.fn(),
  removeTaggedPlayer: vi.fn(),
}));
const events = vi.hoisted(() => ({ getRoleHints: vi.fn() }));

vi.mock("@/config/env", () => ({ API_URL: "https://x/" }));
vi.mock("@/services/admin/CommercialLicenseService", () => ({
  CommercialLicenseService: vi.fn(function CommercialLicenseService() {
    return license;
  }),
}));
vi.mock("@/store/admin/commercialEvents/service", () => ({ commercialEventsService: () => events }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { MAYBE_SAVED_TEXT } from "@/store/admin/commercialEvents/errors";
import { useCommercialLicenseStore } from "./store";

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const hints = (battleTag: string, hostOf: string[]) => ({ battleTag, organizerOf: [], delegateOf: [], hostOf: hostOf.map((eventId) => ({ eventId })) });

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

test("an older role-hint lookup that answers last cannot overwrite a newer one", async () => {
  const older = deferred<unknown[]>();
  events.getRoleHints.mockReturnValueOnce(older.promise);
  events.getRoleHints.mockResolvedValueOnce([hints("Foo#1", [])]);
  const store = useCommercialLicenseStore();

  const first = store.loadRoleHints(["Foo#1", "Bar#2"], { full: true });
  await store.loadRoleHints(["Foo#1"]);
  older.resolve([hints("Foo#1", ["EV-OLD1"]), hints("Bar#2", ["EV-BAR2"])]);
  await first;

  expect(store.roleHints["Foo#1"]).toEqual(hints("Foo#1", []));
  // Tags the newer lookup did not cover still take the older answer.
  expect(store.roleHints["Bar#2"]).toEqual(hints("Bar#2", ["EV-BAR2"]));
});

test("a role-hint lookup that answers after the tag was removed does not bring it back", async () => {
  const lookup = deferred<unknown[]>();
  events.getRoleHints.mockReturnValueOnce(lookup.promise);
  license.removeTaggedPlayer.mockResolvedValue(undefined);
  const store = useCommercialLicenseStore();

  const pending = store.loadRoleHints(["Foo#1"]);
  expect(await store.remove("Foo#1")).toBe(true);
  lookup.resolve([hints("Foo#1", ["EV-1"])]);
  await pending;

  expect(store.roleHints).toEqual({});
});

test("an older tagged-accounts load that answers last cannot overwrite a newer one", async () => {
  const older = deferred<unknown[]>();
  license.getTaggedPlayers.mockReturnValueOnce(older.promise);
  license.getTaggedPlayers.mockResolvedValueOnce([{ battleTag: "New#1" }]);
  events.getRoleHints.mockResolvedValue([hints("New#1", [])]);
  const store = useCommercialLicenseStore();

  const first = store.load();
  await store.load();
  older.resolve([{ battleTag: "Old#1" }]);
  await first;

  expect(store.taggedPlayers).toEqual([{ battleTag: "New#1" }]);
  expect(store.loading).toBe(false);
});

test("clearing drops a pending load and keeps a write in flight marked", async () => {
  const older = deferred<unknown[]>();
  license.getTaggedPlayers.mockReturnValueOnce(older.promise);
  const store = useCommercialLicenseStore();
  store.saving = true;

  const pending = store.load();
  store.clear();
  older.resolve([{ battleTag: "Old#1" }]);
  await pending;

  expect(store.taggedPlayers).toEqual([]);
  expect(store.loading).toBe(false);
  expect(store.saving).toBe(true);
  expect(events.getRoleHints).not.toHaveBeenCalled();
});

test("an uncertain tag write reloads the list before saving clears", async () => {
  license.upsertTaggedPlayer.mockRejectedValue(new TypeError("Failed to fetch"));
  license.getTaggedPlayers.mockResolvedValue([{ battleTag: "Foo#1" }]);
  events.getRoleHints.mockResolvedValue([hints("Foo#1", [])]);
  const store = useCommercialLicenseStore();

  expect(await store.upsert("Foo#1", {} as never)).toBe(false);

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  expect(store.taggedPlayers).toEqual([{ battleTag: "Foo#1" }]);
  expect(store.saving).toBe(false);
});
