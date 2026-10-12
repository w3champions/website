import { test } from "vitest";
import { strict as assert } from "node:assert";
import { EAdminRouteName } from "@/router/types";
import { isNavItemActive, navGroupOfDetailRoute } from "./adminNavActive";

test("a nav item stays active on its detail pages", () => {
  assert.equal(isNavItemActive(EAdminRouteName.NETDIAG_RUNS, EAdminRouteName.NETDIAG_RUN_DETAIL), true);
  assert.equal(isNavItemActive(EAdminRouteName.NETDIAG_RUNS, EAdminRouteName.NETDIAG_NEW_RUN), true);
  assert.equal(isNavItemActive(EAdminRouteName.NETDIAG_MEASUREMENTS, EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL), true);
  assert.equal(isNavItemActive(EAdminRouteName.COMMERCIAL_EVENTS_EVENTS, EAdminRouteName.COMMERCIAL_EVENTS_EVENT_DETAIL), true);
  assert.equal(isNavItemActive(EAdminRouteName.LAG_REPORTS, EAdminRouteName.LAG_REPORT_DETAIL), true);
});

test("otherwise the decision stays with the link", () => {
  assert.equal(isNavItemActive(EAdminRouteName.NETDIAG_RUNS, EAdminRouteName.NETDIAG_RUNS), undefined);
  assert.equal(isNavItemActive(EAdminRouteName.NETDIAG_RUNS, EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL), undefined);
  assert.equal(isNavItemActive(undefined, EAdminRouteName.NETDIAG_RUN_DETAIL), undefined);
  assert.equal(isNavItemActive(EAdminRouteName.NETDIAG_RUNS, undefined), undefined);
});

const groups = [
  { title: "Commercial Events", items: [{ routeName: EAdminRouteName.COMMERCIAL_EVENTS_EVENTS }] },
  { title: "Network Diagnostics", items: [{ routeName: EAdminRouteName.LAG_REPORTS }, { routeName: EAdminRouteName.NETDIAG_RUNS }, { routeName: EAdminRouteName.NETDIAG_MEASUREMENTS }] },
  { title: "No sub items" },
];

test("a detail page names the navigation group that holds its item, so the group can be opened", () => {
  assert.equal(navGroupOfDetailRoute(groups, EAdminRouteName.NETDIAG_RUN_DETAIL), "Network Diagnostics");
  assert.equal(navGroupOfDetailRoute(groups, EAdminRouteName.NETDIAG_NEW_RUN), "Network Diagnostics");
  assert.equal(navGroupOfDetailRoute(groups, EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL), "Network Diagnostics");
  assert.equal(navGroupOfDetailRoute(groups, EAdminRouteName.LAG_REPORT_DETAIL), "Network Diagnostics");
  assert.equal(navGroupOfDetailRoute(groups, EAdminRouteName.COMMERCIAL_EVENTS_EVENT_DETAIL), "Commercial Events");
});

test("list pages and unknown routes name no group: the link opens its own group", () => {
  assert.equal(navGroupOfDetailRoute(groups, EAdminRouteName.NETDIAG_RUNS), undefined);
  assert.equal(navGroupOfDetailRoute(groups, undefined), undefined);
  assert.equal(navGroupOfDetailRoute([], EAdminRouteName.NETDIAG_RUN_DETAIL), undefined);
});
