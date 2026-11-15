import cloneDeep from "lodash/cloneDeep";
import merge from "lodash/merge";
import { createPinia, setActivePinia } from "pinia";
import type { Component, Plugin } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import { createVuetify } from "vuetify";
import data from "@/locales/data";
import en from "@/locales/en";
import { EAdminRouteName } from "@/router/types";
import { BANS_LOCATION } from "@/store/admin/bans/translate";

let currentT: ((key: string, named: Record<string, string | number>) => string) | null = null;

/** A fresh Pinia (setActivePinia), the app's English texts, Vuetify and a memory router; installs the jsdom shims. */
export function banTestPlugins(): Plugin[] {
  const pinia = createPinia();
  setActivePinia(pinia);
  // jsdom lacks these browser APIs that Vuetify's fields touch.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  if (!("visualViewport" in globalThis)) Object.assign(globalThis, { visualViewport: null });
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    missingWarn: false,
    fallbackWarn: false,
    messages: { en: merge(cloneDeep(data.en), en) },
  });
  currentT = (key, named) => i18n.global.t(key, named);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/admin/admin-banned-players", name: EAdminRouteName.BANNED_PLAYERS, component: { template: "<div />" } },
      { path: "/player/:id", component: { template: "<div />" } },
      // The memory router starts at "/", and Vuetify's v-btn/v-chip resolve an empty `to` against it on every render.
      { path: "/:pathMatch(.*)*", component: { template: "<div />" } },
    ],
  });
  return [pinia, i18n, createVuetify(), router];
}

/** Renders a dialog's content in place while it is open (no overlay, no teleport). */
export const inlineDialog: Component = { props: ["modelValue"], template: "<div><slot v-if='modelValue' /></div>" };

/** The text `views_admin_bans.<name>` of the i18n made by the last banTestPlugins() call. */
export function txt(name: string, named?: Record<string, string | number>): string {
  if (!currentT) throw new Error("txt() needs banTestPlugins() to have run first");
  return currentT(`${BANS_LOCATION}.${name}`, named ?? {});
}

const ID_ATTRIBUTES = ["id", "for", "aria-controls", "aria-describedby", "aria-labelledby", "aria-owns", "aria-activedescendant"];

/** html() with the values of the generated id attributes emptied, so snapshots do not depend on counters. */
export function normalizedHtml(wrapper: { html(): string }): string {
  return ID_ATTRIBUTES.reduce((html, attribute) => html.replace(new RegExp(`(\\s${attribute})="[^"]*"`, "g"), (_match, name: string) => `${name}=""`), wrapper.html());
}
