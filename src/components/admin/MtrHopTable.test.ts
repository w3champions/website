// @vitest-environment jsdom
import { test } from "vitest";
import { strict as assert } from "node:assert";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import MtrHopTable from "./MtrHopTable.vue";
import type { HopData } from "@/store/admin/lagReports/types";

const hops: HopData[] = [
  { hopNumber: 1, host: "192.168.1.1", avgRttMs: 1.2, minRttMs: 1, maxRttMs: 2, stddevMs: 0.1, lossPercent: 0 },
  { hopNumber: 2, host: null, avgRttMs: null, minRttMs: null, maxRttMs: null, stddevMs: null, lossPercent: 100 },
];

function render(props: Record<string, unknown>): VueWrapper {
  return mount(MtrHopTable, { props: { hops, ...props }, global: { plugins: [createVuetify()] } });
}

function headerTexts(wrapper: VueWrapper): string[] {
  return wrapper.findAll("th").map((th) => th.text());
}

function cellTexts(wrapper: VueWrapper, row: number): string[] {
  return wrapper.findAll("tbody tr")[row].findAll("td").map((td) => td.text());
}

test("lag-report usage keeps exactly its columns when no hop info is given", () => {
  const wrapper = render({});
  assert.deepEqual(headerTexts(wrapper), ["#", "Host", "Avg", "Min", "Max", "Loss"]);
  assert.deepEqual(cellTexts(wrapper, 0), ["1", "192.168.1.1", "1ms", "1ms", "2ms", "0.0%"]);
});

test("the baseline delta column still works", () => {
  const wrapper = render({ baselineHops: hops });
  assert.deepEqual(headerTexts(wrapper), ["#", "Host", "Avg", "Min", "Max", "Loss", "Δ"]);
});

test("hop info adds ASN, network and location columns, with dashes for unknown hops", () => {
  const wrapper = render({ hopInfo: [{ asn: 3320, asnOrg: "Deutsche Telekom AG", city: "Berlin", country: "DE" }, null] });
  assert.deepEqual(headerTexts(wrapper), ["#", "Host", "ASN", "Network", "Location", "Avg", "Min", "Max", "Loss"]);
  assert.deepEqual(cellTexts(wrapper, 0).slice(1, 5), ["192.168.1.1", "AS3320", "Deutsche Telekom AG", "Berlin, DE"]);
  assert.deepEqual(cellTexts(wrapper, 1).slice(1, 5), ["*", "—", "—", "—"]);
});

test("a hop without measured loss shows a dash and is never flagged degraded", () => {
  const wrapper = render({ hops: [{ hopNumber: 1, host: "10.0.0.1", avgRttMs: null, minRttMs: null, maxRttMs: null, stddevMs: null, lossPercent: null }] });
  assert.equal(cellTexts(wrapper, 0)[5], "—");
  assert.equal(wrapper.find("tbody tr").classes().includes("text-error"), false);
  assert.equal(wrapper.find("tbody td:nth-child(6)").classes().includes("text-warning"), false);
});

test("the empty message spans every column", () => {
  const plain = render({ hops: [] });
  assert.equal(plain.find("tbody td").attributes("colspan"), "6");
  const enriched = render({ hops: [], hopInfo: [null], baselineHops: hops });
  assert.equal(enriched.find("tbody td").attributes("colspan"), "10");
});
