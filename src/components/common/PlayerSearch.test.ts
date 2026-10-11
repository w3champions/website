// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { VAutocomplete } from "vuetify/components/VAutocomplete";
import PlayerSearch from "@/components/common/PlayerSearch.vue";

const { searchPlayer } = vi.hoisted(() => ({ searchPlayer: vi.fn() }));

vi.mock("@/services/ProfileService", () => ({
  default: { searchPlayer },
}));

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

describe("PlayerSearch", () => {
  let wrapper: VueWrapper;

  function mountSearch() {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    wrapper = mount(PlayerSearch, { global: { plugins: [createVuetify()] } });
    return wrapper.findComponent(VAutocomplete);
  }

  async function type(text: string) {
    wrapper.findComponent(VAutocomplete).vm.$emit("update:search", text);
    await wrapper.vm.$nextTick();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    searchPlayer.mockReset();
  });

  afterEach(() => {
    wrapper.unmount();
    vi.useRealTimers();
  });

  it("ignores a stale reply that arrives after a newer one", async () => {
    const first = deferred<never[]>();
    const second = deferred<never[]>();
    searchPlayer.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    mountSearch();

    await type("abc");
    await vi.advanceTimersByTimeAsync(500);
    await type("abcd");
    await vi.advanceTimersByTimeAsync(500);
    expect(searchPlayer).toHaveBeenCalledTimes(2);

    second.resolve([player("abcd#1")]);
    await flushPromises();
    first.resolve([player("abc#1")]);
    await flushPromises();

    expect(items(wrapper)).toEqual([player("abcd#1")]);
  });

  it("drops an in-flight reply and a pending search once the text gets too short", async () => {
    const inFlight = deferred<never[]>();
    searchPlayer.mockReturnValueOnce(inFlight.promise);
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
    expect(searchPlayer).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending debounced search on unmount", async () => {
    mountSearch();
    await type("abc");
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(searchPlayer).not.toHaveBeenCalled();
    mountSearch(); // keeps afterEach's unmount valid
  });

  it("emits playerFound every time a player is picked, including the same one again", async () => {
    const autocomplete = mountSearch();

    autocomplete.vm.$emit("update:modelValue", "abc#1");
    autocomplete.vm.$emit("update:modelValue", undefined); // text edited, selection cleared
    autocomplete.vm.$emit("update:modelValue", "abc#1");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("playerFound")).toEqual([["abc#1"], ["abc#1"]]);
  });

  it("emits playerFound when the same value is re-picked without the model changing", async () => {
    const autocomplete = mountSearch();

    autocomplete.vm.$emit("update:modelValue", "abc#1");
    autocomplete.vm.$emit("update:modelValue", "abc#1");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("playerFound")).toHaveLength(2);
  });
});
