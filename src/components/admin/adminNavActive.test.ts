import { test } from "vitest";
import { strict as assert } from "node:assert";
import { EAdminRouteName } from "@/router/types";
import { isNavItemActive } from "./adminNavActive";

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
