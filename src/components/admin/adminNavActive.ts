import { EAdminRouteName } from "@/router/types";

/** Pages that belong to a navigation item without being its route; the item stays highlighted on them. */
const DETAIL_ROUTES: Partial<Record<string, readonly string[]>> = {
  [EAdminRouteName.COMMERCIAL_EVENTS_EVENTS]: [EAdminRouteName.COMMERCIAL_EVENTS_EVENT_DETAIL],
  [EAdminRouteName.LAG_REPORTS]: [EAdminRouteName.LAG_REPORT_DETAIL],
  [EAdminRouteName.NETDIAG_RUNS]: [EAdminRouteName.NETDIAG_NEW_RUN, EAdminRouteName.NETDIAG_RUN_DETAIL],
  [EAdminRouteName.NETDIAG_MEASUREMENTS]: [EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL],
};

/** `true` on a detail page of the item; `undefined` leaves the decision to the link (Vuetify `active`). */
export function isNavItemActive(itemRouteName: string | undefined, currentRouteName: unknown): true | undefined {
  if (itemRouteName === undefined || typeof currentRouteName !== "string") return undefined;
  return DETAIL_ROUTES[itemRouteName]?.includes(currentRouteName) ? true : undefined;
}

interface NavGroup {
  title: string;
  items?: readonly { routeName?: string }[];
}

/**
 * The title of the navigation group whose item owns the current detail page. Vuetify opens a group only for
 * its link's own route, so after a direct load of a detail page the group has to be opened by name.
 */
export function navGroupOfDetailRoute(groups: readonly NavGroup[], currentRouteName: unknown): string | undefined {
  return groups.find((group) => (group.items ?? []).some((item) => isNavItemActive(item.routeName, currentRouteName) === true))?.title;
}
