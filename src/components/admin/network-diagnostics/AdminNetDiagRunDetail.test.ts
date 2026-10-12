// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { HttpError } from "@/services/http/AuthorizedClient";

const { service } = vi.hoisted(() => ({ service: { getRun: vi.fn(), getTargets: vi.fn(), cancelRun: vi.fn() } }));
vi.mock("@/store/admin/networkDiagnostics/service", () => ({ networkDiagnosticsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { useNetDiagRunsStore } from "@/store/admin/networkDiagnostics/runsStore";
import AdminNetDiagRunDetail from "./AdminNetDiagRunDetail.vue";

let cancelledAt: string | null = null;

function runDetail(id: string): unknown {
  return {
    run: {
      id,
      createdAt: "2026-10-09T14:05:00Z",
      createdBy: "Admin#1",
      audience: { kind: "Users", battleTags: ["A#1"] },
      targets: { floNodeIds: [], allFloNodes: false, coreServers: [], baselines: [], customTargets: [], includeDefaultGateway: true },
      methods: ["TcpPing"],
      windowSeconds: 60,
      expectedDurationSeconds: 60,
      allowDuringGame: false,
      windowStart: null,
      windowEnd: null,
      cancelledAt,
      counters: { assigned: 1, delivered: 0, submitted: 0, expired: 0 },
    },
    assignments: [],
  };
}

interface CancelHandle {
  cancelRun(): Promise<void>;
}

function mountPage(runId: string, attach = false): VueWrapper {
  return mount(AdminNetDiagRunDetail, {
    props: { runId },
    attachTo: attach ? document.body : undefined,
    global: { plugins: [createVuetify({ components, directives })], stubs: { RouterLink: true, NetDiagFleetView: true, ...(attach ? { transition: false, "transition-group": false } : {}) } },
  });
}

const startCancel = (wrapper: VueWrapper): Promise<void> => (wrapper.vm as unknown as CancelHandle).cancelRun();
const requestedRunIds = (): unknown[] => service.getRun.mock.calls.map((call) => call[1]);

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  cancelledAt = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
  service.getTargets.mockResolvedValue({ floNodes: [], coreServers: [], baselines: [] });
  service.getRun.mockImplementation((_token: string, id: string) => Promise.resolve(runDetail(id)));
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

it("a cancel that settles after the page was left leaves the next run intact", async () => {
  let resolveCancel!: (value: unknown) => void;
  service.cancelRun.mockReturnValueOnce(new Promise((resolve) => (resolveCancel = resolve)));
  const pageA = mountPage("a");
  await flushPromises();
  const pending = startCancel(pageA);
  pageA.unmount();
  mountPage("b");
  await flushPromises();

  resolveCancel({ id: "a" });
  await pending;
  await flushPromises();

  expect(requestedRunIds()).toEqual(["a", "b"]);
  expect(useNetDiagRunsStore().runDetail?.run.id).toBe("b");
});

it("a cancel that settles after a prop change to another run leaves it intact", async () => {
  let resolveCancel!: (value: unknown) => void;
  service.cancelRun.mockReturnValueOnce(new Promise((resolve) => (resolveCancel = resolve)));
  const page = mountPage("a");
  await flushPromises();
  const pending = startCancel(page);
  await page.setProps({ runId: "b" });
  await flushPromises();

  resolveCancel({ id: "a" });
  await pending;
  await flushPromises();

  expect(requestedRunIds()).toEqual(["a", "b"]);
  expect(useNetDiagRunsStore().runDetail?.run.id).toBe("b");
});

it("a successful cancel refreshes the run that is still shown", async () => {
  const page = mountPage("a");
  await flushPromises();
  expect(page.text()).toContain("Running");
  service.cancelRun.mockImplementationOnce(() => {
    cancelledAt = "2026-10-09T15:00:00Z";
    return Promise.resolve({ id: "a" });
  });

  await startCancel(page);
  await flushPromises();

  expect(requestedRunIds()).toEqual(["a", "a"]);
  expect(page.text()).toContain("Cancelled");
});

it("a failed cancel shows the error and does not reload", async () => {
  const page = mountPage("a");
  await flushPromises();
  service.cancelRun.mockRejectedValueOnce(new Error("boom"));

  await startCancel(page);
  await flushPromises();

  expect(page.text()).toContain("boom");
  expect(requestedRunIds()).toEqual(["a"]);
});

it("a 409 on an already cancelled run keeps the message and reloads the run", async () => {
  const page = mountPage("a");
  await flushPromises();
  cancelledAt = "2026-10-09T15:00:00Z";
  service.cancelRun.mockRejectedValueOnce(new HttpError(409, "POST", "u", ""));

  await startCancel(page);
  await flushPromises();

  expect(page.text()).toContain("This run is already cancelled.");
  expect(page.text()).toContain("Cancelled");
  expect(requestedRunIds()).toEqual(["a", "a"]);
});

/** Opens the real dialog from its activator, confirms, and lets the leave transition finish. Returns everything that was logged. */
async function cancelThroughDialog(): Promise<string[]> {
  const logged: string[] = [];
  // jsdom has no visualViewport, which Vuetify's dialog reads while opening.
  vi.stubGlobal("visualViewport", { width: 1024, height: 768, offsetLeft: 0, offsetTop: 0, scale: 1, addEventListener() {}, removeEventListener() {} });
  const spies = [vi.spyOn(console, "error"), vi.spyOn(console, "warn")];
  spies.forEach((spy) => spy.mockImplementation((...args: unknown[]) => void logged.push(args.map((arg) => (arg instanceof Error ? `${arg.name}: ${arg.message}` : typeof arg === "string" ? arg : "[non-text]")).join(" "))));
  const onError = (event: ErrorEvent): void => void logged.push(`unhandled: ${event.message}`);
  window.addEventListener("error", onError);
  const page = mountPage("a", true);
  await flushPromises();
  const open = page.findAll("button").find((button) => button.text() === "Cancel run");
  await open!.trigger("click");
  await flushPromises();
  const confirm = Array.from(document.body.querySelectorAll<HTMLButtonElement>(".v-dialog button")).find((button) => button.textContent?.includes("Cancel run"));
  expect(confirm).toBeDefined();
  confirm!.click();
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 600));
  await flushPromises();
  window.removeEventListener("error", onError);
  vi.unstubAllGlobals();
  page.unmount();
  return logged.filter((line) => !line.includes("Failed to cancel network diagnostic run"));
}

it("a successful cancel closes the dialog without any console error or warning", async () => {
  service.cancelRun.mockImplementationOnce(() => {
    cancelledAt = "2026-10-09T15:00:00Z";
    return Promise.resolve({ id: "a" });
  });
  expect(await cancelThroughDialog()).toEqual([]);
});

it("a 409 through the dialog closes it without any console error or warning", async () => {
  service.cancelRun.mockImplementationOnce(() => {
    cancelledAt = "2026-10-09T15:00:00Z";
    return Promise.reject(new HttpError(409, "POST", "u", JSON.stringify({ error: "already_cancelled" })));
  });
  expect(await cancelThroughDialog()).toEqual([]);
});
