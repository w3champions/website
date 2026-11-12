import type { Plugin } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import { createVuetify } from "vuetify";
import en from "@/locales/en";
import type { SmurfEventDetail } from "@/services/admin/smurf-detection/SmurfEventsResponse";

/** The plugins a smurf events component needs in a test: a fresh Pinia, English texts and Vuetify. */
export function testPlugins(): Plugin[] {
  const pinia = createPinia();
  setActivePinia(pinia);
  // jsdom lacks these browser APIs that Vuetify's fields touch.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  if (!("visualViewport" in globalThis)) Object.assign(globalThis, { visualViewport: null });
  return [pinia, createI18n({ legacy: false, locale: "en", messages: { en } }), createVuetify()];
}

/** Renders a dialog's content in place while it is open (no overlay, no teleport). */
export const inlineDialog = { props: ["modelValue"], template: "<div><slot v-if='modelValue' /></div>" };

/** A manual event with fake BattleTags. */
export function manualEvent(overrides: Partial<SmurfEventDetail> = {}): SmurfEventDetail {
  return {
    id: "ev1",
    name: "LAN party",
    origin: "manual",
    review: "unreviewed",
    from: "2026-10-01T06:00:00.000Z",
    to: "2026-10-02T22:00:00.000Z",
    counts: { networks: 1, machines: 3, attendees: 3, homes: 2 },
    endedLinks: 1,
    createdAt: "2026-10-04T00:00:00.000Z",
    attendees: ["Anchor#1001", "Anchor#1002", "Guest#1003"],
    anchors: ["Anchor#1001", "Anchor#1002"],
    requested: { from: "2026-10-01T00:00:00.000Z", to: "2026-10-03T00:00:00.000Z" },
    networks: [{ hash8: "0a1b2c3d", firstAt: "2026-10-01T08:00:00.000Z", lastAt: "2026-10-02T20:00:00.000Z", accounts: 3 }],
    machines: [{ hash8: "9f8e7d6c", accounts: 2 }],
    evidence: { countries: 1, networkDaysBefore: 0, networkDaysAfter: 0, returningAttendees: 1 },
    endedLinksList: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }],
    ...overrides,
  };
}
