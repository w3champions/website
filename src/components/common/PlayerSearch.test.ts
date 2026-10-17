// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { VAutocomplete } from "vuetify/components/VAutocomplete";
import PlayerSearch from "@/components/common/PlayerSearch.vue";

const { searchPlayer, globalSearch, flags } = vi.hoisted(() => ({
  searchPlayer: vi.fn(),
  globalSearch: vi.fn(),
  flags: { useNewSearch: true },
}));

vi.mock("@/services/ProfileService", () => ({
  default: { searchPlayer },
}));

vi.mock("@/services/GlobalSearchService", () => ({
  default: { search: globalSearch },
}));

// A getter, so each pass of the suite below can switch the search engine.
vi.mock("@/helpers/featureFlags", () => ({
  get USE_NEW_SEARCH() {
    return flags.useNewSearch;
  },
}));

// The row template's avatar and season badge helpers read window._env_ at import time.
vi.mock("@/config/env", () => ({ API_URL: "/mock/", INGAME_STATIC_RESOURCES_URL: "/mock/" }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const player = (battleTag: string) => ({ battleTag }) as never;

function items(wrapper: VueWrapper): unknown[] {
  return wrapper.findComponent(VAutocomplete).props("items") as unknown[];
}

describe.each([true, false])("PlayerSearch (USE_NEW_SEARCH %s)", (useNewSearch) => {
  let wrapper: VueWrapper;
  // The engine the flag selects: global-search when on, the legacy player search when off.
  const search = () => (useNewSearch ? globalSearch : searchPlayer);

  function mountSearch() {
    // jsdom lacks these browser APIs that Vuetify's field and menu overlay touch.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    if (!("visualViewport" in globalThis)) globalThis.visualViewport = null;
    // Attached so the menu teleports into a real document and its items can be clicked.
    wrapper = mount(PlayerSearch, {
      attachTo: document.body,
      global: { plugins: [createVuetify()] },
    });
    return wrapper.findComponent(VAutocomplete);
  }

  // Goes through the real input, so VAutocomplete drives the search text and focus.
  async function type(text: string) {
    const input = wrapper.find("input");
    await input.trigger("focus");
    await input.setValue(text);
  }

  async function pick(battleTag: string) {
    const option = [...document.querySelectorAll<HTMLElement>(".v-list-item")]
      .find((el) => el.textContent?.includes(battleTag));
    expect(option, `option ${battleTag}`).toBeDefined();
    option!.click();
    await flushPromises();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    flags.useNewSearch = useNewSearch;
    searchPlayer.mockReset();
    globalSearch.mockReset();
  });

  afterEach(() => {
    wrapper.unmount();
    vi.useRealTimers();
  });

  it("dispatches to the engine USE_NEW_SEARCH selects", async () => {
    search().mockResolvedValue([player("abc#1")]);
    mountSearch();

    await type("abc");
    await vi.advanceTimersByTimeAsync(500);

    expect(search()).toHaveBeenCalledWith(...(useNewSearch ? ["abc", "", 20] : ["abc"]));
    expect(useNewSearch ? searchPlayer : globalSearch).not.toHaveBeenCalled();
    expect(items(wrapper)).toEqual([player("abc#1")]);
  });

  it("ignores a stale reply that arrives after a newer one", async () => {
    const first = deferred<never[]>();
    const second = deferred<never[]>();
    search().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    mountSearch();

    await type("abc");
    await vi.advanceTimersByTimeAsync(500);
    await type("abcd");
    await vi.advanceTimersByTimeAsync(500);
    expect(search()).toHaveBeenCalledTimes(2);

    second.resolve([player("abcd#1")]);
    await flushPromises();
    first.resolve([player("abc#1")]);
    await flushPromises();

    expect(items(wrapper)).toEqual([player("abcd#1")]);
  });

  it("drops an in-flight reply and a pending search once the text gets too short", async () => {
    const inFlight = deferred<never[]>();
    search().mockReturnValueOnce(inFlight.promise);
    mountSearch();

    await type("abc");
    await vi.advanceTimersByTimeAsync(500);
    await type("ab");
    inFlight.resolve([player("abc#1")]);
    await flushPromises();
    expect(items(wrapper)).toEqual([]);

    await type("abc");
    await type("ab");
    await vi.advanceTimersByTimeAsync(1000);
    expect(search()).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending debounced search on unmount", async () => {
    mountSearch();
    await type("abc");
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(search()).not.toHaveBeenCalled();
    mountSearch(); // keeps afterEach's unmount valid
  });

  it("keeps loading and drops the in-flight reply once newer text is queued", async () => {
    const first = deferred<never[]>();
    const second = deferred<never[]>();
    search().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const autocomplete = mountSearch();

    await type("abc");
    await vi.advanceTimersByTimeAsync(500);
    await type("abcd"); // queued behind the debounce while "abc" is still in flight
    first.resolve([player("abc#1")]);
    await flushPromises();

    expect(items(wrapper)).toEqual([]);
    expect(autocomplete.props("loading")).toBe(true);

    await vi.advanceTimersByTimeAsync(500);
    second.resolve([player("abcd#1")]);
    await flushPromises();

    expect(items(wrapper)).toEqual([player("abcd#1")]);
    expect(autocomplete.props("loading")).toBe(false);
  });

  it("emits playerFound when the same player is re-picked after the text was edited", async () => {
    search().mockResolvedValue([player("abc#1")]);
    mountSearch();

    await type("abc");
    await vi.advanceTimersByTimeAsync(500);
    await pick("abc#1");
    expect(wrapper.emitted("playerFound")).toEqual([["abc#1"]]);

    await type("abc#"); // diverges from the pick, as in BattleTagPicker clearing its value
    await vi.advanceTimersByTimeAsync(500);
    await pick("abc#1");

    expect(wrapper.emitted("playerFound")).toEqual([["abc#1"], ["abc#1"]]);
  });

  it("keeps the selection when the field only loses focus", async () => {
    search().mockResolvedValue([player("abc#1")]);
    const autocomplete = mountSearch();

    await type("abc");
    await vi.advanceTimersByTimeAsync(500);
    await pick("abc#1");
    await wrapper.find("input").trigger("blur");
    await flushPromises();

    expect(autocomplete.props("modelValue")).toBe("abc#1");
  });
});
